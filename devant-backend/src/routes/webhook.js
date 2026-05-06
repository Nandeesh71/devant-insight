const router = require('express').Router();
const crypto = require('crypto');
const pool = require('../db/pool');
const { analyzeCommit } = require('../services/ai');
const { broadcastProjectUpdate } = require('../realtime');
const { createGitHubServices } = require('../integrations/github/services');
const { validateWebhookPayload } = require('../integrations/github/webhooks/event-contracts');

function verifySignature(req) {
  const sig = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // If no secret configured, accept but log a warning (useful for local/dev)
  if (!secret) {
    console.warn('GITHUB_WEBHOOK_SECRET not set — webhook signature checks are disabled');
    return true;
  }

  // If secret is configured, signature header must be present
  if (!sig) return false;

  const hmac = crypto.createHmac('sha256', secret);
  // req.body is expected to be a Buffer (express.raw used in index.js)
  const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body));
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
  } catch {
    return false;
  }
}

router.post('/', async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const payload = JSON.parse(req.body.toString());
  const eventValidation = validateWebhookPayload(event, payload);
  if (!eventValidation.ok) {
    console.error('[WEBHOOK][SCHEMA_MISMATCH]', { event, errors: eventValidation.errors });
    return res.status(400).json({ error: 'Invalid webhook payload', event, details: eventValidation.errors });
  }

  try {
    switch (event) {

      case 'push': {
        // Find which project this repo belongs to
        const repoId = payload.repository?.id;
        const { rows } = await pool.query(
          'SELECT id, github_repo_full_name, github_access_token FROM projects WHERE github_repo_id=$1', [repoId]
        );
        if (!rows.length) break;
        const project_id = rows[0].id;
        const repoFullName = rows[0].github_repo_full_name;
        const repoToken = rows[0].github_access_token;
        const [owner, repo] = String(repoFullName || '').split('/');
        const github = repoToken && owner && repo ? createGitHubServices(repoToken) : null;

        for (const commit of payload.commits || []) {
          let additions = Number(commit.added?.length || 0);
          let deletions = Number(commit.removed?.length || 0);
          let filesChanged = [...(commit.added || []), ...(commit.modified || []), ...(commit.removed || [])];
          let author = commit.author?.username || commit.author?.name;

          if (github) {
            try {
              const detail = await github.commits.getCommit(owner, repo, commit.id);

              additions = Number(detail?.stats?.additions ?? additions);
              deletions = Number(detail?.stats?.deletions ?? deletions);
              filesChanged = Array.isArray(detail?.files)
                ? detail.files.map((f) => f.filename).filter(Boolean)
                : filesChanged;
              author = detail?.author?.login || author;
            } catch {
              // Keep webhook payload fallback values if detail lookup fails.
            }
          }

          // Insert commit
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
            [project_id, commit.id, author, commit.message, commit.timestamp, additions, deletions, JSON.stringify(filesChanged)]
          );

          // Trigger async AI analysis
          analyzeCommit(commit.id, commit.message, commit.modified || []).catch(console.error);
        }

        broadcastProjectUpdate(project_id, 'commit.created', {
          count: Array.isArray(payload.commits) ? payload.commits.length : 0,
          sha: payload.after || null,
          repo: payload.repository?.full_name || null,
        });
        break;
      }

      case 'pull_request': {
        const repoId = payload.repository?.id;
        const { rows } = await pool.query(
          'SELECT id, github_repo_full_name, github_access_token FROM projects WHERE github_repo_id=$1', [repoId]
        );
        if (!rows.length) break;
        const project_id = rows[0].id;
        const repoFullName = rows[0].github_repo_full_name;
        const repoToken = rows[0].github_access_token;
        const [owner, repo] = String(repoFullName || '').split('/');
        const github = repoToken && owner && repo ? createGitHubServices(repoToken) : null;
        const pr = payload.pull_request;
        const action = payload.action;

        // Upsert PR basic info
        await pool.query(
          `INSERT INTO pull_requests (project_id, github_pr_number, title, author_github_username, status, reviewers, opened_at, merged_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (project_id, github_pr_number)
           DO UPDATE SET title=EXCLUDED.title, status=EXCLUDED.status, reviewers=EXCLUDED.reviewers, merged_at=EXCLUDED.merged_at`,
          [project_id, pr.number, pr.title, pr.user?.login,
           pr.state, JSON.stringify(pr.requested_reviewers?.map(r => r.login) || []),
           pr.created_at, pr.merged_at]
        );

        // If PR synchronized (new commits pushed to PR) or PR was merged, fetch commits for the PR
        if (action === 'synchronize' || (action === 'closed' && pr.merged)) {
          try {
            if (github) {
              const commits = await github.pulls.listPullCommits(owner, repo, pr.number, { per_page: 100, page: 1 });
              for (const c of commits) {
                const sha = c.sha;
                const author = c.author?.login || c.commit?.author?.name || null;
                const message = c.commit?.message || '';
                const timestamp = c.commit?.author?.date || new Date().toISOString();
                const additions = Number(c.stats?.additions || 0);
                const deletions = Number(c.stats?.deletions || 0);
                const files_changed = Array.isArray(c.files) ? c.files.map(f => f.filename) : [];

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
                  [project_id, sha, author, message, timestamp, additions, deletions, JSON.stringify(files_changed)]
                ).catch(() => {});
              }
            }
          } catch (e) {
            console.warn('Failed to fetch PR commits:', e && e.message ? e.message : e);
          }
        }

        // Broadcast PR update event
        broadcastProjectUpdate(project_id, 'pull_request.updated', {
          number: pr.number,
          action,
          status: pr.state,
          merged: pr.merged === true,
          merged_at: pr.merged_at || null,
        });

        // If merged, also broadcast a commit.created event for the merge
        if (action === 'closed' && pr.merged) {
          broadcastProjectUpdate(project_id, 'pull_request.merged', {
            number: pr.number,
            merge_commit_sha: pr.merge_commit_sha || null,
          });
        }

        break;
      }

      case 'deployment_status': {
        const repoId = payload.repository?.id;
        const { rows } = await pool.query(
          'SELECT id FROM projects WHERE github_repo_id=$1', [repoId]
        );
        if (!rows.length) break;
        const project_id = rows[0].id;
        const ds = payload.deployment_status;

        if (ds.state === 'success' || ds.state === 'failure') {
          await pool.query(
            `INSERT INTO deployments (project_id, environment, status, deployed_at, log_url)
             VALUES ($1,$2,$3,$4,$5)`,
            [project_id, payload.deployment?.environment || 'production',
             ds.state, ds.created_at, ds.log_url]
          );

          broadcastProjectUpdate(project_id, 'deployment.updated', {
            status: ds.state,
            environment: payload.deployment?.environment || 'production',
            deployed_at: ds.created_at,
          });

          // If this is a successful deployment, try to link it to a PR
          if (ds.state === 'success' && payload.deployment?.ref) {
            // Find the most recent PR for this repo that was merged
            const prResult = await pool.query(
              `SELECT id, github_pr_number FROM pull_requests 
               WHERE project_id=$1 AND status='closed' AND merged_at IS NOT NULL
               ORDER BY merged_at DESC LIMIT 1`,
              [project_id]
            );
            
            if (prResult.rows.length) {
              const prNum = prResult.rows[0].github_pr_number;
              const firstCommitResult = await pool.query(
                `SELECT MIN(timestamp) as first_commit FROM commits WHERE project_id=$1`,
                [project_id]
              );
              
              await pool.query(
                `INSERT INTO pr_deployments (project_id, pr_number, first_commit_at, deployed_at)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (project_id, pr_number) DO UPDATE SET deployed_at=$4`,
                [project_id, prNum, firstCommitResult.rows[0]?.first_commit || new Date(), ds.created_at]
              ).catch(() => {}); // ignore duplicates
            }
          }
        }
        break;
      }

      case 'deployment': {
        const repoId = payload.repository?.id;
        const { rows } = await pool.query(
          'SELECT id FROM projects WHERE github_repo_id=$1', [repoId]
        );
        if (!rows.length) break;
        const project_id = rows[0].id;
        const dep = payload.deployment;

        // Create deployment record
        await pool.query(
          `INSERT INTO deployments (project_id, environment, status, deployed_at)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT DO NOTHING`,
          [project_id, dep.environment || 'production', 'pending', dep.created_at]
        ).catch(() => {});

        broadcastProjectUpdate(project_id, 'deployment.created', {
          status: 'pending',
          environment: dep.environment || 'production',
          deployed_at: dep.created_at,
        });
        break;
      }
    }

    res.json({ received: true, event });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
