const router = require('express').Router();
const pool = require('../db/pool');

// GET deployments for a project
router.get('/:project_id', async (req, res, next) => {
  try {
    const { project_id } = req.params;
    const { rows } = await pool.query(
      'SELECT id, environment, status, deployed_at, log_url FROM deployments WHERE project_id=$1 ORDER BY deployed_at DESC LIMIT 100',
      [project_id]
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) { next(err); }
});

module.exports = router;
