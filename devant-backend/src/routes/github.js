const router = require('express').Router();
const axios = require('axios');
const pool = require('../db/pool');
const { broadcastProjectUpdate } = require('../realtime');
const { createGitHubServices } = require('../integrations/github/services');
const { computeDoraMetrics } = require('../integrations/github/services/dora.service');
const { buildActivityTimeline } = require('../integrations/github/services/activity.service');

const projectCardCache = new Map();

const decodeAppToken = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
};

const getBackendBaseUrl = (req) => {
  if (process.env.BACKEND_URL) return String(process.env.BACKEND_URL).replace(/\/$/, '');

  const forwardedProto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const forwardedHost = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();

  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '');
  return 'http://localhost:3001';
};

function safeFirstLine(message) {
  if (!message) return null;
  return String(message).split('\n')[0] || null;
}

function splitRepoFullName(repoFullName) {
  const [owner, repo] = String(repoFullName || '').split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid GitHub repo full name: ${repoFullName}`);
  }
  return { owner, repo };
}

async function upsertTeamMember(projectId, githubUsername, displayName, role) {
  if (!githubUsername) return;

  const existing = await pool.query(
    'SELECT id FROM team_members WHERE project_id=$1 AND github_username=$2 LIMIT 1',
    [projectId, githubUsername]
  );

  if (existing.rows[0]) {
    await pool.query(
      `UPDATE team_members
       SET display_name=$1, role=$2
       WHERE id=$3`,
      [displayName || githubUsername, role, existing.rows[0].id]
    );
    return;
  }

  await pool.query(
    `INSERT INTO team_members (project_id, github_username, display_name, role)
     VALUES ($1,$2,$3,$4)`,
    [projectId, githubUsername, displayName || githubUsername, role]
  );
}

const getSupabaseUserFromToken = async (token) => {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !token) return null;

  try {
    const userRes = await axios.get(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    return userRes.data || null;
  } catch {
    return null;
  }
};

const resolveLocalUserFromToken = async (token) => {
  if (!token) return null;

  const decoded = decodeAppToken(token);
  if (decoded?.sub) {
    const { rows } = await pool.query(
      'SELECT id, provider, email, name, avatar_url, github_login, github_connected, created_at FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (rows[0]) return rows[0];
  }

  const supabaseUser = await getSupabaseUserFromToken(token);
  if (!supabaseUser?.id || !supabaseUser?.email) return null;

  const { rows } = await pool.query(
    `SELECT id, provider, email, name, avatar_url, github_login, github_connected, created_at
     FROM users
     WHERE provider = 'google' AND provider_id = $1`,
    [supabaseUser.id]
  );

  return rows[0] || null;
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
    return oauthToken?.access_token || null;
  } catch (e) {
    console.warn('[WARN] Failed to extract GitHub token:', e.message);
    return null;
  }
};

function createServices(token) {
  return createGitHubServices(token);
}

router.get('/auth', (req, res) => {
  const { project_id, token } = req.query;
  const state = token
    ? JSON.stringify({ project_id: project_id || 'none', token: token || null, mode: 'connect' })
    : project_id || 'none';

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'repo read:org',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;

    let stateData = null;
    try {
      stateData = JSON.parse(state);
      if (stateData.mode) {
        return res.redirect(`/api/auth/callback?code=${code}&state=${encodeURIComponent(state)}`);
      }
    } catch {
      // keep backward-compatible plain state flow
    }

    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) return res.status(400).json({ error: 'GitHub auth failed' });

    const services = createServices(accessToken);
    const userRes = await services.client.request('users/get-authenticated', {});

    const appToken = stateData?.token;
    const currentUser = stateData?.mode === 'connect' && appToken ? await resolveLocalUserFromToken(appToken) : null;

    if (state && state !== 'none' && !stateData?.mode) {
      try {
        await pool.query('UPDATE projects SET github_access_token=$1 WHERE id=$2', [accessToken, state]);
      } catch {
        // ignore invalid state id for legacy callback calls
      }
    }

    if (currentUser) {
      const updated = await pool.query(
        `UPDATE users SET
           provider = 'google',
           github_login = $1,
           github_connected = TRUE,
           oauth_token = $2,
           updated_at = NOW()
         WHERE id = $3
         RETURNING id, provider, email, name, avatar_url, github_login, github_connected, created_at`,
        [userRes.data.login, JSON.stringify({ access_token: accessToken, provider: 'github' }), currentUser.id]
      );

      const user = updated.rows[0];
      const jwtToken = Buffer.from(
        JSON.stringify({
          sub: user.id,
          email: user.email,
          name: user.name,
          provider: user.provider,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400 * 7,
        })
      ).toString('base64');

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/github-connected?token=${jwtToken}&username=${userRes.data.login}&project_id=${state}`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/github-connected?token=${accessToken}&username=${userRes.data.login}&project_id=${state}`);
  } catch (err) {
    next(err);
  }
});

router.get('/repos', async (req, res, next) => {
  try {
    const token = await getGithubAccessTokenForRequest(req);
    if (!token) return res.status(401).json({ error: 'GitHub account not connected' });

    const services = createServices(token);
    const repos = await services.repositories.listUserRepositories({ per_page: 100, sort: 'updated', page: 1 });

    res.json(
      repos.map((repo) => ({
        id: repo.id,
        full_name: repo.full_name,
        name: repo.name,
        description: repo.description,
        private: repo.private,
        language: repo.language,
        updated_at: repo.updated_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/disconnect', async (req, res, next) => {
  try {
    const appToken = req.headers.authorization?.replace('Bearer ', '');
    const decoded = appToken ? decodeAppToken(appToken) : null;
    if (!decoded?.sub) return res.status(401).json({ error: 'Unauthorized' });

    const { rows } = await pool.query(
      `UPDATE users
       SET github_connected = FALSE,
           github_login = NULL,
           oauth_token = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, provider, email, name, avatar_url, github_login, github_connected, created_at`,
      [decoded.sub]
    );

    await pool.query('UPDATE projects SET github_access_token = NULL WHERE user_id = $1', [decoded.sub]);

    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/repo-card/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const token = await getGithubAccessTokenForRequest(req);
    if (!token) return res.status(401).json({ error: 'GitHub account not connected' });

    const key = `${owner}/${repo}`.toLowerCase();
    const cached = projectCardCache.get(key);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return res.json(cached.data);
    }

    const services = createServices(token);

    const [repoData, commitList, contributors] = await Promise.all([
      services.repositories.getRepo(owner, repo),
      services.commits.listCommits(owner, repo, { per_page: 1, page: 1 }),
      services.contributors.listContributors(owner, repo, { per_page: 3, page: 1 }),
    ]);

    const latestCommit = commitList.items[0] || null;

    const payload = {
      repoName: repoData?.name || repo || '-',
      repoFullPath: repoData?.full_name || `${owner}/${repo}`,
      isPrivate: typeof repoData?.private === 'boolean' ? repoData.private : null,
      starCount: typeof repoData?.stargazers_count === 'number' ? repoData.stargazers_count : null,
      lastCommitMessage: safeFirstLine(latestCommit?.commit?.message) || '-',
      lastCommitBranch: repoData?.default_branch || 'main',
      lastCommitTime: latestCommit?.commit?.author?.date || null,
      topContributors: Array.isArray(contributors)
        ? contributors.slice(0, 3).map((c) => ({
            login: c?.login || 'unknown',
            avatarUrl: c?.avatar_url || '',
          }))
        : [],
    };

    projectCardCache.set(key, { data: payload, expiresAt: now + 5 * 60 * 1000 });
    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.post('/link-repo', async (req, res, next) => {
  try {
    const { project_id, repo_full_name, access_token } = req.body;
    const token = access_token || (await getGithubAccessTokenForRequest(req));
    if (!token) return res.status(401).json({ error: 'GitHub account not connected' });

    const appToken = req.headers.authorization?.replace('Bearer ', '');
    const decoded = appToken ? decodeAppToken(appToken) : null;
    const user_id = decoded?.sub || null;

    const { owner, repo } = splitRepoFullName(repo_full_name);
    const services = createServices(token);

    const repoData = await services.repositories.getRepo(owner, repo);

    const backendBaseUrl = getBackendBaseUrl(req);
    const webhookTargetUrl = `${(process.env.WEBHOOK_URL || backendBaseUrl).replace(/\/$/, '')}/api/webhook`;

    try {
      await services.webhooks.ensureWebhook(owner, repo, webhookTargetUrl, process.env.GITHUB_WEBHOOK_SECRET || '');
    } catch (hookErr) {
      console.warn('Webhook registration failed:', hookErr.message);
    }

    let rows = [];
    const repoName = repoData?.name || repo_full_name;
    const repoDescription = repoData?.description || `Linked GitHub repository: ${repo_full_name}`;

    if (project_id) {
      ({ rows } = await pool.query(
        `UPDATE projects SET
          user_id=$1,
          name=$2,
          description=$3,
          github_repo_full_name=$4,
          github_repo_id=$5,
          github_access_token=$6
         WHERE id=$7 RETURNING *`,
        [user_id, repoName, repoDescription, repo_full_name, repoData.id, token, project_id]
      ));
    }

    if (!rows.length) {
      ({ rows } = await pool.query(
        `INSERT INTO projects (user_id, name, description, github_repo_full_name, github_repo_id, github_access_token)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user_id, repoName, repoDescription, repo_full_name, repoData.id, token]
      ));
    }

    const project = rows[0];

    try {
      broadcastProjectUpdate(project.id, 'project.linked', {
        repo: repo_full_name,
        projectId: project.id,
      });
    } catch {
      // non-fatal
    }

    res.json({ success: true, project });

    (async () => {
      try {
        const syncUrl = `${backendBaseUrl}/api/github/sync/${project.id}`;
        await axios.post(syncUrl, {}, { headers: { Authorization: `Bearer ${token}` }, timeout: 5 * 60 * 1000 });
        broadcastProjectUpdate(project.id, 'project.hydrated', { projectId: project.id });
      } catch (e) {
        console.warn('Background project sync failed:', e?.message || e);
      }
    })();
  } catch (err) {
    next(err);
  }
});

router.post('/sync/:project_id', async (req, res, next) => {
  try {
    const { project_id } = req.params;
    const appToken = req.headers.authorization?.replace('Bearer ', '');
    const decoded = appToken ? decodeAppToken(appToken) : null;
    const requestToken = await getGithubAccessTokenForRequest(req);

    const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [project_id]);
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });

    const project = rows[0];
    const token = requestToken || project.github_access_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized project sync' });

    if (project.user_id && decoded?.sub && project.user_id !== decoded.sub) {
      return res.status(403).json({ error: 'Forbidden project sync' });
    }

    if (!project.github_repo_full_name) return res.status(400).json({ error: 'No repo linked' });

    if (project.github_access_token !== token) {
      await pool.query('UPDATE projects SET github_access_token=$1 WHERE id=$2', [token, project_id]);
    }

    const { owner, repo } = splitRepoFullName(project.github_repo_full_name);
    const services = createServices(token);

    const [repoData, contributors, collaborators] = await Promise.all([
      services.repositories.getRepo(owner, repo),
      services.contributors.listContributors(owner, repo, { per_page: 100, page: 1, anon: 'false' }),
      services.repositories.listCollaborators(owner, repo, { per_page: 100, page: 1, affiliation: 'all' }),
    ]);

    if (repoData?.owner?.login) {
      await upsertTeamMember(project_id, repoData.owner.login, repoData.owner.login, 'owner');
    }

    for (const contributor of contributors) {
      await upsertTeamMember(project_id, contributor.login, contributor.login, 'contributor');
    }

    for (const collaborator of collaborators) {
      await upsertTeamMember(project_id, collaborator.login, collaborator.login, 'collaborator');
    }

    const commitShallowList = await services.commits.listAllCommits(owner, repo, { per_page: 100, page: 1 }, 50);

    for (const commit of commitShallowList) {
      try {
        const detail = await services.commits.getCommit(owner, repo, commit.sha);
        const additions = Number(detail?.stats?.additions ?? 0);
        const deletions = Number(detail?.stats?.deletions ?? 0);
        const filesChanged = Array.isArray(detail?.files)
          ? detail.files.map((file) => ({
              filename: file.filename,
              status: file.status,
              additions: file.additions,
              deletions: file.deletions,
              changes: file.changes,
              patch: file.patch,
            }))
          : [];

        const authorUsername = detail?.author?.login || commit?.author?.login || commit?.commit?.author?.name || null;

        await pool.query(
          `INSERT INTO commits (project_id, sha, author_github_username, message, timestamp, lines_added, lines_removed, files_changed)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (sha)
           DO UPDATE SET
             author_github_username = EXCLUDED.author_github_username,
             message = EXCLUDED.message,
             timestamp = EXCLUDED.timestamp,
             lines_added = EXCLUDED.lines_added,
             lines_removed = EXCLUDED.lines_removed,
             files_changed = EXCLUDED.files_changed`,
          [
            project_id,
            commit.sha,
            authorUsername,
            detail?.commit?.message || commit?.commit?.message || '',
            detail?.commit?.author?.date || commit?.commit?.author?.date || null,
            additions,
            deletions,
            JSON.stringify(filesChanged),
          ]
        );
      } catch (commitErr) {
        console.warn('Commit sync failed for', commit?.sha, commitErr.message);
      }
    }

    const pulls = [];
    let pullPage = 1;
    for (let i = 0; i < 20; i += 1) {
      const pageResult = await services.pulls.listPulls(owner, repo, {
        state: 'all',
        per_page: 100,
        page: pullPage,
      });

      if (!pageResult.items.length) break;
      pulls.push(...pageResult.items);

      if (!pageResult.pagination?.next) break;
      pullPage += 1;
    }

    for (const pr of pulls) {
      const prDetails = await services.pulls.getPull(owner, repo, pr.number);
      const requestedReviewers = await services.pulls.listRequestedReviewers(owner, repo, pr.number).catch(() => ({}));
      const reviews = await services.pulls.listReviews(owner, repo, pr.number, { per_page: 100, page: 1 }).catch(() => []);

      const reviewLogins = new Set([
        ...(requestedReviewers?.users || []).map((u) => u?.login).filter(Boolean),
        ...reviews.map((r) => r?.user?.login).filter(Boolean),
      ]);

      await pool.query(
        `INSERT INTO pull_requests (project_id, github_pr_number, title, author_github_username, status, reviewers, conflict_flag, opened_at, merged_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (project_id, github_pr_number)
         DO UPDATE SET
           title = EXCLUDED.title,
           author_github_username = EXCLUDED.author_github_username,
           status = EXCLUDED.status,
           reviewers = EXCLUDED.reviewers,
           conflict_flag = EXCLUDED.conflict_flag,
           opened_at = EXCLUDED.opened_at,
           merged_at = EXCLUDED.merged_at`,
        [
          project_id,
          pr.number,
          prDetails?.title || pr?.title,
          prDetails?.user?.login || pr?.user?.login || null,
          prDetails?.state || pr?.state || 'open',
          JSON.stringify(Array.from(reviewLogins)),
          prDetails?.mergeable === false,
          prDetails?.created_at || pr?.created_at || null,
          prDetails?.merged_at || pr?.merged_at || null,
        ]
      );
    }

    const deployments = await services.deployments.listDeployments(owner, repo, { per_page: 100, page: 1 });

    for (const deployment of deployments) {
      const statuses = await services.deployments
        .listDeploymentStatuses(owner, repo, deployment.id, { per_page: 1, page: 1 })
        .catch(() => []);

      const latestStatus = statuses[0] || null;

      await pool.query(
        `INSERT INTO deployments (project_id, environment, status, deployed_at, log_url)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          project_id,
          deployment.environment || 'production',
          latestStatus?.state || 'pending',
          latestStatus?.updated_at || deployment.created_at,
          latestStatus?.log_url || null,
        ]
      ).catch(() => {});
    }

    const releases = await services.releases.listReleases(owner, repo, { per_page: 100, page: 1 });
    const issues = await services.issues.listIssues(owner, repo, { state: 'all', per_page: 100, page: 1 });

    const dora = computeDoraMetrics({
      pullRequests: pulls,
      deployments,
      now: new Date(),
    });

    const activity = buildActivityTimeline({
      commits: commitShallowList,
      pullRequests: pulls,
      issues: issues.items,
      deployments,
    });

    broadcastProjectUpdate(project_id, 'sync.completed', {
      repo: project.github_repo_full_name,
      commits: commitShallowList.length,
      pulls: pulls.length,
      deployments: deployments.length,
      releases: releases.length,
      issues: issues.items.length,
    });

    return res.json({
      success: true,
      message: `Synced data for ${project.github_repo_full_name}`,
      owner: repoData?.owner?.login || null,
      contributors: contributors.length,
      collaborators: collaborators.length,
      commits: commitShallowList.length,
      prs: pulls.length,
      deployments: deployments.length,
      releases: releases.length,
      issues: issues.items.length,
      dora,
      activityPreview: activity.slice(0, 20),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
