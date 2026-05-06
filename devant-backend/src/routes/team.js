const router = require('express').Router();
const pool = require('../db/pool');
const { createGitHubServices } = require('../integrations/github/services');

// Simple in-memory cache for GitHub user lookups
// key: username, value: { data, expiresAt }
const ghUserCache = new Map();

async function fetchGithubUser(login, services) {
  if (!login) return null;
  const key = String(login).toLowerCase();
  const now = Date.now();
  const cached = ghUserCache.get(key);
  if (cached && cached.expiresAt > now) return cached.data;

  try {
    const resp = await services.client.request('users/get-by-username', {
      path: { username: key },
    });
    const d = resp.data || null;
    const out = d
      ? {
          login: d.login,
          avatar_url: d.avatar_url,
          html_url: d.html_url,
          name: d.name || null,
          bio: d.bio || null,
          public_repos: d.public_repos || 0,
          followers: d.followers || 0,
          type: d.type || null,
        }
      : null;
    ghUserCache.set(key, { data: out, expiresAt: now + 1000 * 60 * 60 }); // 1 hour
    return out;
  } catch (err) {
    // on any failure, cache a null for a short time to avoid retries
    ghUserCache.set(key, { data: null, expiresAt: now + 1000 * 60 * 5 });
    return null;
  }
}

async function loadProjectWithRepo(project_id) {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [project_id]);
  return rows[0] || null;
}

async function fetchGithubRepoInsights(project) {
  if (!project?.github_repo_full_name) {
    console.warn('[TEAM] No repo full name for project');
    return { owner: null, contributors: [], collaborators: [] };
  }

  const token = project?.github_access_token;
  if (!token) {
    console.warn('[TEAM] No GitHub token for project', project.id);
    return { owner: null, contributors: [], collaborators: [] };
  }

  const services = createGitHubServices(token);
  const [repoOwner, repoName] = String(project.github_repo_full_name).split('/');
  if (!repoOwner || !repoName) {
    console.warn('[TEAM] Invalid repo full name:', project.github_repo_full_name);
    return { owner: null, contributors: [], collaborators: [] };
  }

  try {
    const [repoResult, contributorsResult, collaboratorsResult] = await Promise.allSettled([
      services.repositories.getRepo(repoOwner, repoName),
      services.contributors.listContributors(repoOwner, repoName, { per_page: 100, page: 1 }),
      services.repositories.listCollaborators(repoOwner, repoName, { per_page: 100, page: 1, affiliation: 'all' }),
    ]);

    // owner basic info
    const ownerRaw = repoResult.status === 'fulfilled' ? repoResult.value?.owner || null : null;
    const owner = ownerRaw ? await fetchGithubUser(ownerRaw.login, services) : null;

    // contributors and collaborators: enrich with user profile info (cached)
    const contributorsList = contributorsResult.status === 'fulfilled' ? (contributorsResult.value || []) : [];
    const collaboratorsList = collaboratorsResult.status === 'fulfilled' ? (collaboratorsResult.value || []) : [];

    const contributors = await Promise.all(
      contributorsList.slice(0, 200).map(async (c) => {
        const u = await fetchGithubUser(c.login || c.author || '', services);
        return {
          ...Object.assign({}, u || { login: c.login, avatar_url: null, html_url: null, name: null, bio: null, public_repos: 0, followers: 0, type: null }),
          contributions: c.contributions || 0,
        };
      })
    );

    const collaborators = await Promise.all(
      collaboratorsList.slice(0, 200).map(async (c) => {
        const u = await fetchGithubUser(c.login || '', services);
        return {
          ...Object.assign({}, u || { login: c.login, avatar_url: null, html_url: null, name: null, bio: null, public_repos: 0, followers: 0, type: null }),
          permissions: c.permissions || null,
        };
      })
    );

    return { owner, contributors, collaborators };
  } catch (err) {
    console.error('[TEAM] Error fetching GitHub repo insights:', err.message);
    return { owner: null, contributors: [], collaborators: [] };
  }
}

// GET team data: members, owner, collaborators, contributors
router.get('/:project_id', async (req, res, next) => {
  try {
    const { project_id } = req.params;

    // Fetch local team members + their activity status
    const { rows: teamRows } = await pool.query(
      `SELECT
        tm.*,
        c.last_commit,
        c.commit_count,
        CASE
          WHEN c.last_commit >= NOW() - INTERVAL '1 day'  THEN 'active'
          WHEN c.last_commit >= NOW() - INTERVAL '3 days' THEN 'recent'
          WHEN c.last_commit >= NOW() - INTERVAL '7 days' THEN 'idle'
          ELSE 'inactive'
        END as status
       FROM team_members tm
       LEFT JOIN (
         SELECT author_github_username,
                MAX(timestamp) as last_commit,
                COUNT(*) as commit_count
         FROM commits WHERE project_id=$1
         GROUP BY author_github_username
       ) c ON c.author_github_username = tm.github_username
       WHERE tm.project_id=$1`,
      [project_id]
    );

    // Fetch GitHub repo data (owner, contributors, collaborators)
    const { rows: projectRows } = await pool.query(
      'SELECT * FROM projects WHERE id=$1',
      [project_id]
    );
    const project = projectRows[0];
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Fetch GitHub insights with better error handling
    let repoInsights = { owner: null, contributors: [], collaborators: [] };
    try {
      repoInsights = await fetchGithubRepoInsights(project);
    } catch (err) {
      console.error('[TEAM] Failed to fetch GitHub insights:', err.message);
      // Continue with empty insights - don't fail the entire request
    }

    // Build response: members (local team), owner (repo owner), collaborators, contributors (all from GitHub)
    const responseData = {
      members: teamRows || [],
      owner: repoInsights.owner || null,
      collaborators: repoInsights.collaborators || [],
      contributors: repoInsights.contributors || [],
      // Legacy format support (wrapped in 'repo' for backward compatibility)
      repo: {
        full_name: project?.github_repo_full_name || null,
        owner: repoInsights.owner,
        collaborators: repoInsights.collaborators,
        contributors: repoInsights.contributors,
      },
    };
    
    res.json(responseData);
  } catch (err) { 
    console.error('[TEAM] Error in GET team:', err);
    next(err); 
  }
});

// POST add team member
router.post('/:project_id', async (req, res, next) => {
  try {
    const { project_id } = req.params;
    const { github_username, display_name, role, monthly_salary } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO team_members (project_id, github_username, display_name, role, monthly_salary)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [project_id, github_username, display_name, role, monthly_salary]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE remove team member
router.delete('/:project_id/:member_id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM team_members WHERE id=$1 AND project_id=$2',
      [req.params.member_id, req.params.project_id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET finance summary for a project
router.get('/:project_id/finance', async (req, res, next) => {
  try {
    const { project_id } = req.params;

    const [project, team] = await Promise.all([
      pool.query('SELECT * FROM projects WHERE id=$1', [project_id]),
      pool.query('SELECT SUM(monthly_salary) as monthly_burn FROM team_members WHERE project_id=$1', [project_id]),
    ]);

    if (!project.rows.length) return res.status(404).json({ error: 'Not found' });

    const p = project.rows[0];
    const monthlyBurn = parseFloat(team.rows[0].monthly_burn) || 0;

    // Calculate months elapsed since start_date
    const start = p.start_date ? new Date(p.start_date) : new Date();
    const now = new Date();
    const monthsElapsed = Math.max(0, (now - start) / (1000 * 60 * 60 * 24 * 30));
    const spent = monthlyBurn * monthsElapsed;
    const remaining = (p.budget || 0) - spent;
    const runway = monthlyBurn > 0 ? remaining / monthlyBurn : null;
    const burnPercent = p.budget > 0 ? Math.min(100, (spent / p.budget) * 100) : 0;

    res.json({
      budget: p.budget,
      spent: Math.round(spent),
      remaining: Math.round(remaining),
      monthly_burn: monthlyBurn,
      runway_months: runway ? Math.round(runway * 10) / 10 : null,
      burn_percent: Math.round(burnPercent),
      status: burnPercent > 85 ? 'critical' : burnPercent > 65 ? 'warning' : 'healthy',
    });
  } catch (err) { next(err); }
});

module.exports = router;
