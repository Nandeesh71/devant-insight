const router = require('express').Router();
const pool = require('../db/pool');

const decodeAppToken = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
};

const getGithubAccessTokenForRequest = async (req) => {
  const appToken = req.headers.authorization?.replace('Bearer ', '');
  if (!appToken) return null;

  const decoded = decodeAppToken(appToken);
  if (!decoded?.sub) return null;

  try {
    const { rows } = await pool.query('SELECT oauth_token, github_connected FROM users WHERE id = $1', [decoded.sub]);
    const user = rows[0];
    if (!user || !user.github_connected || !user.oauth_token) return null;

    const oauthToken = typeof user.oauth_token === 'string' ? JSON.parse(user.oauth_token) : user.oauth_token;
    const token = oauthToken?.access_token;
    return token || null;
  } catch (e) {
    console.warn('[WARN] Failed to extract GitHub token:', e.message);
    return null;
  }
};

// ── Helper: Find project by owner/repo ──────────
async function findProjectByRepo(owner, repo, githubAccessToken = null) {
  const full_name = `${owner}/${repo}`;
  const params = [full_name];
  let query = 'SELECT * FROM projects WHERE github_repo_full_name = $1';

  if (githubAccessToken) {
    params.push(githubAccessToken);
    query += ' AND github_access_token = $2';
  }

  const { rows } = await pool.query(query, params);
  return rows[0] || null;
}

// GET all projects for the signed-in user
router.get('/', async (req, res, next) => {
  try {
    const appToken = req.headers.authorization?.replace('Bearer ', '');
    if (!appToken) return res.json([]);

    const decoded = decodeAppToken(appToken);
    if (!decoded?.sub) return res.json([]);

    const { rows } = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [decoded.sub]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET single project
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST create project
router.post('/', async (req, res, next) => {
  try {
    const { workspace_id, name, description, budget, start_date, end_date } = req.body;
    const appToken = req.headers.authorization?.replace('Bearer ', '');
    const decoded = appToken ? decodeAppToken(appToken) : null;
    const user_id = decoded?.sub || null;

    const { rows } = await pool.query(
      `INSERT INTO projects (workspace_id, user_id, name, description, budget, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [workspace_id, user_id, name, description, budget, start_date, end_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT update project
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, budget, start_date, end_date, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE projects SET name=$1, description=$2, budget=$3,
       start_date=$4, end_date=$5, status=$6 WHERE id=$7 RETURNING *`,
      [name, description, budget, start_date, end_date, status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE project
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET project dashboard summary (commits, PRs, team, health)
router.get('/:id/summary', async (req, res, next) => {
  try {
    const pid = req.params.id;

    const [project, commits, prs, team, health, deployments] = await Promise.all([
      pool.query('SELECT * FROM projects WHERE id=$1', [pid]),
      pool.query('SELECT COUNT(*) as total, SUM(lines_added) as lines_added, SUM(lines_removed) as lines_removed FROM commits WHERE project_id=$1', [pid]),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'open\') as open FROM pull_requests WHERE project_id=$1', [pid]),
      pool.query('SELECT * FROM team_members WHERE project_id=$1', [pid]),
      pool.query('SELECT * FROM health_scores WHERE project_id=$1 ORDER BY calculated_at DESC LIMIT 1', [pid]),
      pool.query('SELECT COUNT(*) as total FROM deployments WHERE project_id=$1', [pid]),
    ]);

    if (!project.rows.length) return res.status(404).json({ error: 'Project not found' });

    res.json({
      project: project.rows[0],
      commits: commits.rows[0],
      pull_requests: prs.rows[0],
      team: team.rows,
      health: health.rows[0] || null,
      deployments: deployments.rows[0],
    });
  } catch (err) { next(err); }
});

// GET project summary — /:owner/:repo/summary (new format)
router.get('/:owner/:repo/summary', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    // Look up project by owner/repo without requiring a matching stored GitHub access
    // token. Requiring the stored token caused valid projects to be missing when
    // the token differed or wasn't present for the requesting user.
    const project = await findProjectByRepo(owner, repo);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [commits, prs, team, health, deployments, languages, lastCommit, openIssues] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, SUM(lines_added) as lines_added, SUM(lines_removed) as lines_removed FROM commits WHERE project_id=$1', [project.id]),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'open\') as open FROM pull_requests WHERE project_id=$1', [project.id]),
      pool.query('SELECT * FROM team_members WHERE project_id=$1', [project.id]),
      pool.query('SELECT * FROM health_scores WHERE project_id=$1 ORDER BY calculated_at DESC LIMIT 1', [project.id]),
      pool.query('SELECT COUNT(*) as total FROM deployments WHERE project_id=$1', [project.id]),
      pool.query('SELECT ai_type_tag FROM commits WHERE project_id=$1 GROUP BY ai_type_tag ORDER BY COUNT(*) DESC LIMIT 3', [project.id]),
      pool.query('SELECT timestamp, message, author_github_username FROM commits WHERE project_id=$1 ORDER BY timestamp DESC LIMIT 1', [project.id]),
      pool.query('SELECT COUNT(*) as total FROM pull_requests WHERE project_id=$1 AND status=\'open\'', [project.id]),
    ]);

    const recentCommits = await pool.query(
      'SELECT sha, message, author_github_username, timestamp, lines_added, lines_removed, ai_type_tag FROM commits WHERE project_id=$1 ORDER BY timestamp DESC LIMIT 50',
      [project.id]
    );

    res.json({
      project: {
        id: project.id,
        name: project.name,
        github_repo_full_name: project.github_repo_full_name,
        github_repo_id: project.github_repo_id,
        budget: project.budget,
        created_at: project.created_at,
      },
      health: health.rows[0] || { score: 0, rating: 'Unknown' },
      commits: {
        total: parseInt(commits.rows[0].total) || 0,
        lines_added: parseInt(commits.rows[0].lines_added) || 0,
        lines_removed: parseInt(commits.rows[0].lines_removed) || 0,
        recent: recentCommits.rows,
      },
      pull_requests: {
        total: parseInt(prs.rows[0].total) || 0,
        open: parseInt(prs.rows[0].open) || 0,
      },
      team: {
        members: team.rows,
        count: team.rows.length,
      },
      deployments: {
        total: parseInt(deployments.rows[0].total) || 0,
      },
      languages: languages.rows.map(l => l.ai_type_tag).filter(Boolean),
      last_activity: lastCommit.rows[0]?.timestamp || null,
      open_issues: parseInt(openIssues.rows[0].total) || 0,
    });
  } catch (err) { next(err); }
});

module.exports = router;
