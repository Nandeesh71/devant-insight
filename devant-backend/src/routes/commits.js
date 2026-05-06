const router = require('express').Router();
const pool = require('../db/pool');
const { analyzeProjectCommits } = require('../services/ai');
const { createGitHubServices } = require('../integrations/github/services');

// Helper: Parse files_changed JSON and add GitHub URLs
function normalizeCommit(commit, repoFullName = null) {
  let filesChanged = [];
  try {
    if (typeof commit.files_changed === 'string') {
      filesChanged = JSON.parse(commit.files_changed);
    } else if (Array.isArray(commit.files_changed)) {
      filesChanged = commit.files_changed;
    }
  } catch (e) {
    filesChanged = [];
  }

  // Add GitHub URLs if we have repo info
  if (repoFullName) {
    filesChanged = filesChanged.map(f => ({
      ...f,
      github_url: `https://github.com/${repoFullName}/blob/${commit.sha}/${f.filename}`,
      patch_url: `https://github.com/${repoFullName}/commit/${commit.sha}.patch`,
    }));
  }

  return {
    ...commit,
    files_changed: filesChanged,
    github_url: repoFullName ? `https://github.com/${repoFullName}/commit/${commit.sha}` : null,
    patch_url: repoFullName ? `https://github.com/${repoFullName}/commit/${commit.sha}.patch` : null,
  };
}

// GET commits for a project — RETURNS ALL COMMITS unless ?limit is specified
router.get('/:project_id', async (req, res, next) => {
  try {
    const { project_id } = req.params;
    // Default: no limit (return ALL commits). Client can specify ?limit=N to paginate.
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const limitClause = limit ? `LIMIT ${Math.min(limit, 10000)}` : '';
    
    // Get project info for GitHub URLs
    const projectRows = await pool.query('SELECT github_repo_full_name FROM projects WHERE id=$1', [project_id]);
    const repoFullName = projectRows.rows[0]?.github_repo_full_name || null;
    
    const { rows } = await pool.query(
      `SELECT * FROM commits WHERE project_id=$1 ORDER BY timestamp DESC ${limitClause}`,
      [project_id]
    );
    
    // Normalize all commits
    const normalized = rows.map(c => normalizeCommit(c, repoFullName));
    res.json(normalized);
  } catch (err) { next(err); }
});

// GET a single commit by project and sha
router.get('/:project_id/:sha', async (req, res, next) => {
  try {
    const { project_id, sha } = req.params;
    // allow searching by full sha or prefix (first 7..40 chars)
    const { rows: commitRows } = await pool.query(
      `SELECT * FROM commits WHERE project_id=$1 AND sha LIKE $2 LIMIT 1`,
      [project_id, `${sha}%`]
    );
    if (!commitRows.length) return res.status(404).json({ error: 'Commit not found' });
    
    let commit = commitRows[0];
    
    // Get project info for GitHub URLs and token
    const { rows: projectRows } = await pool.query(
      'SELECT github_repo_full_name, github_access_token FROM projects WHERE id=$1',
      [project_id]
    );
    const project = projectRows[0];
    const repoFullName = project?.github_repo_full_name || null;
    
    // If DB doesn't include file patches, try to fetch from GitHub and persist
    const hasPatch = Array.isArray(commit.files_changed) && commit.files_changed.some(f => f && (f.patch || f.diff || f.patch_text));
    if (!hasPatch && project?.github_repo_full_name && project?.github_access_token) {
      try {
        const [owner, repo] = String(project.github_repo_full_name).split('/');
        if (owner && repo) {
          const github = createGitHubServices(project.github_access_token);
          const data = await github.commits.getCommit(owner, repo, commit.sha);
          
          const files = Array.isArray(data.files)
            ? data.files.map((f) => ({
                filename: f.filename,
                status: f.status,
                additions: f.additions,
                deletions: f.deletions,
                changes: f.changes,
                patch: f.patch,
              }))
            : [];

          if (files.length > 0) {
            const updated = await pool.query(
              `UPDATE commits SET files_changed=$2, lines_added=$3, lines_removed=$4 WHERE id=$1 RETURNING *`,
              [
                commit.id,
                JSON.stringify(files),
                data.stats ? data.stats.additions : commit.lines_added || 0,
                data.stats ? data.stats.deletions : commit.lines_removed || 0,
              ]
            );
            if (updated.rows[0]) commit = updated.rows[0];
          }
        }
      } catch (e) {
        // non-fatal: leave commit as-is
        console.warn('Failed to fetch commit patch from GitHub:', e.message || e);
      }
    }

    // Normalize and return
    res.json(normalizeCommit(commit, repoFullName));
  } catch (err) { next(err); }
});

// POST trigger AI analysis on unanalyzed commits
router.post('/:project_id/analyze', async (req, res, next) => {
  try {
    const { project_id } = req.params;
    await analyzeProjectCommits(project_id);
    res.json({ success: true, message: 'AI analysis triggered' });
  } catch (err) { next(err); }
});

// GET commit stats per contributor
router.get('/:project_id/contributors', async (req, res, next) => {
  try {
    const { project_id } = req.params;
    const { rows } = await pool.query(
      `SELECT
        author_github_username,
        COUNT(*) as commit_count,
        SUM(lines_added) as lines_added,
        SUM(lines_removed) as lines_removed,
        MAX(timestamp) as last_commit
       FROM commits
       WHERE project_id=$1
       GROUP BY author_github_username
       ORDER BY commit_count DESC`,
      [project_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
