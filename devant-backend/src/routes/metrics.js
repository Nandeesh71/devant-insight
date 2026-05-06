const router = require('express').Router();
const pool = require('../db/pool');

// ── Helper: Find project by owner/repo ──────────
async function findProjectByRepo(owner, repo) {
  const full_name = `${owner}/${repo}`;
  const { rows } = await pool.query(
    'SELECT * FROM projects WHERE github_repo_full_name = $1',
    [full_name]
  );
  return rows[0] || null;
}

// ── OLD ENDPOINTS (use project_id UUID) ────────

// GET DORA metrics for a project
router.get('/:project_id/dora', async (req, res, next) => {
  try {
    const { project_id } = req.params;

    // Deployment Frequency — deployments per week in last 30 days
    const deployFreq = await pool.query(
      `SELECT COUNT(*) as total,
        COUNT(*) / GREATEST(1, EXTRACT(DAY FROM NOW() - MIN(deployed_at)) / 7.0) as per_week
       FROM deployments WHERE project_id=$1 AND deployed_at >= NOW() - INTERVAL '30 days'`,
      [project_id]
    );

    // Change Lead Time — avg time from first commit to deployment (approximated)
    const leadTime = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (d.deployed_at - c.timestamp)) / 3600) as avg_hours
       FROM deployments d
       CROSS JOIN LATERAL (
         SELECT timestamp FROM commits WHERE project_id=$1 ORDER BY timestamp ASC LIMIT 1
       ) c
       WHERE d.project_id=$1 AND d.status='success'`,
      [project_id]
    );

    // Change Failure Rate — failed deployments / total deployments
    const failureRate = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status='failure') as failures,
        COUNT(*) as total
       FROM deployments WHERE project_id=$1`,
      [project_id]
    );

    const fr = failureRate.rows[0];
    const failurePercent = fr.total > 0 ? (fr.failures / fr.total) * 100 : 0;
    const perWeek = parseFloat(deployFreq.rows[0].per_week) || 0;
    const avgLeadHours = parseFloat(leadTime.rows[0].avg_hours) || 0;

    // Benchmark ratings
    const deployRating = perWeek >= 7 ? 'Elite' : perWeek >= 1 ? 'High' : perWeek >= 0.25 ? 'Medium' : 'Low';
    const leadRating = avgLeadHours <= 24 ? 'Elite' : avgLeadHours <= 168 ? 'High' : avgLeadHours <= 720 ? 'Medium' : 'Low';
    const failRating = failurePercent <= 5 ? 'Elite' : failurePercent <= 10 ? 'High' : failurePercent <= 15 ? 'Medium' : 'Low';

    res.json({
      deployment_frequency: {
        value: Math.round(perWeek * 10) / 10,
        unit: 'per week',
        rating: deployRating,
      },
      change_lead_time: {
        value: Math.round(avgLeadHours),
        unit: 'hours',
        rating: leadRating,
      },
      change_failure_rate: {
        value: Math.round(failurePercent),
        unit: '%',
        rating: failRating,
      },
      failed_recovery_time: {
        value: null,
        unit: 'hours',
        rating: 'N/A',
        note: 'Requires deployment failure + recovery pair data',
      },
    });
  } catch (err) { next(err); }
});

// GET + recalculate health score
router.get('/:project_id/health', async (req, res, next) => {
  try {
    const { project_id } = req.params;

    // Gather signals
    const [project, team, prs, commits, deploys] = await Promise.all([
      pool.query('SELECT * FROM projects WHERE id=$1', [project_id]),
      pool.query('SELECT SUM(monthly_salary) as burn FROM team_members WHERE project_id=$1', [project_id]),
      pool.query(`SELECT COUNT(*) FILTER (WHERE status='open' AND opened_at < NOW() - INTERVAL '3 days') as stale,
                        COUNT(*) as total FROM pull_requests WHERE project_id=$1`, [project_id]),
      pool.query(`SELECT COUNT(*) as total,
                        COUNT(DISTINCT author_github_username) as contributors
                  FROM commits WHERE project_id=$1 AND timestamp >= NOW() - INTERVAL '7 days'`, [project_id]),
      pool.query(`SELECT COUNT(*) as total,
                        COUNT(*) FILTER (WHERE status='failure') as failures
                  FROM deployments WHERE project_id=$1 AND deployed_at >= NOW() - INTERVAL '30 days'`, [project_id]),
    ]);

    if (!project.rows.length) return res.status(404).json({ error: 'Not found' });

    const p = project.rows[0];
    const monthlyBurn = parseFloat(team.rows[0].burn) || 0;

    // Budget score (0-100)
    const start = p.start_date ? new Date(p.start_date) : new Date();
    const monthsElapsed = Math.max(0, (new Date() - start) / (1000 * 60 * 60 * 24 * 30));
    const spent = monthlyBurn * monthsElapsed;
    const burnPercent = p.budget > 0 ? (spent / p.budget) * 100 : 50;
    const budgetScore = Math.max(0, Math.round(100 - burnPercent));

    // Team score (0-100) — penalize stale PRs and idle contributors
    const stalePRs = parseInt(prs.rows[0].stale) || 0;
    const activeContributors = parseInt(commits.rows[0].contributors) || 0;
    const teamScore = Math.max(0, 100 - (stalePRs * 10) + Math.min(20, activeContributors * 5));

    // DORA score (0-100)
    const totalDeploys = parseInt(deploys.rows[0].total) || 0;
    const failedDeploys = parseInt(deploys.rows[0].failures) || 0;
    const doraScore = totalDeploys > 0
      ? Math.max(0, Math.round(100 - (failedDeploys / totalDeploys) * 100))
      : 50;

    // Composite score — weighted average
    const score = Math.round(
      (doraScore * 0.3) +
      (budgetScore * 0.35) +
      (Math.min(100, teamScore) * 0.35)
    );

    // Save to DB
    await pool.query(
      `INSERT INTO health_scores (project_id, score, dora_score, budget_score, team_score)
       VALUES ($1,$2,$3,$4,$5)`,
      [project_id, score, doraScore, budgetScore, Math.min(100, teamScore)]
    );

    res.json({
      score,
      rating: score >= 85 ? 'Healthy' : score >= 60 ? 'At Risk' : 'Critical',
      color: score >= 85 ? 'green' : score >= 60 ? 'yellow' : 'red',
      breakdown: {
        dora: doraScore,
        budget: budgetScore,
        team: Math.min(100, teamScore),
      },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────
// ── NEW ENDPOINTS (use :owner/:repo format) ────
// ─────────────────────────────────────────────────

// GET Health Score — /:owner/:repo/health
router.get('/:owner/:repo/health', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const project = await findProjectByRepo(owner, repo);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Recalculate health
    const [team, prs, commits, deploys] = await Promise.all([
      pool.query('SELECT SUM(monthly_salary) as burn FROM team_members WHERE project_id=$1', [project.id]),
      pool.query(`SELECT COUNT(*) FILTER (WHERE status='open' AND opened_at < NOW() - INTERVAL '3 days') as stale,
                        COUNT(*) as total FROM pull_requests WHERE project_id=$1`, [project.id]),
      pool.query(`SELECT COUNT(*) as total, COUNT(DISTINCT author_github_username) as contributors
                  FROM commits WHERE project_id=$1 AND timestamp >= NOW() - INTERVAL '7 days'`, [project.id]),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='failure') as failures
                  FROM deployments WHERE project_id=$1 AND deployed_at >= NOW() - INTERVAL '30 days'`, [project.id]),
    ]);

    const monthlyBurn = parseFloat(team.rows[0].burn) || 0;
    const start = project.start_date ? new Date(project.start_date) : new Date();
    const monthsElapsed = Math.max(0, (new Date() - start) / (1000 * 60 * 60 * 24 * 30));
    const spent = monthlyBurn * monthsElapsed;
    const burnPercent = project.budget > 0 ? (spent / project.budget) * 100 : 50;
    const budgetScore = Math.max(0, Math.round(100 - burnPercent));

    const stalePRs = parseInt(prs.rows[0].stale) || 0;
    const activeContributors = parseInt(commits.rows[0].contributors) || 0;
    const teamScore = Math.max(0, 100 - (stalePRs * 10) + Math.min(20, activeContributors * 5));

    const totalDeploys = parseInt(deploys.rows[0].total) || 0;
    const failedDeploys = parseInt(deploys.rows[0].failures) || 0;
    const doraScore = totalDeploys > 0
      ? Math.max(0, Math.round(100 - (failedDeploys / totalDeploys) * 100))
      : 50;

    const score = Math.round(
      (doraScore * 0.3) +
      (budgetScore * 0.35) +
      (Math.min(100, teamScore) * 0.35)
    );

    // Determine color based on score
    let color = '#ef4444'; // red
    if (score >= 71) color = '#22c55e'; // green
    else if (score >= 41) color = '#f59e0b'; // amber

    res.json({
      score,
      rating: score >= 85 ? 'Good' : score >= 60 ? 'Needs Attention' : 'Critical',
      color,
      breakdown: {
        commits: commits.rows[0].total,
        deployFreq: totalDeploys,
        leadTime: 0,
        failureRate: totalDeploys > 0 ? Math.round((failedDeploys / totalDeploys) * 100) : 0,
        team: activeContributors,
      },
    });
  } catch (err) { next(err); }
});

// GET Budget — /:owner/:repo/budget
router.get('/:owner/:repo/budget', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const project = await findProjectByRepo(owner, repo);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Get or create budget record (supports extended fields)
    let budgetRow = await pool.query('SELECT * FROM project_budget WHERE project_id=$1', [project.id]);
    if (!budgetRow.rows.length) {
      await pool.query(
        `INSERT INTO project_budget (project_id, budget, monthly_burn, currency, team_size, avg_hourly_rate, hours_per_month, start_date, notes, amount_spent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [project.id, project.budget || null, 0, 'INR', 0, 0, 0, null, null, 0]
      );
      budgetRow = await pool.query('SELECT * FROM project_budget WHERE project_id=$1', [project.id]);
    }

    const b = budgetRow.rows[0];
    const totalBudget = parseFloat(b.budget) || 0;
    const monthlyBurnRate = parseFloat(b.monthly_burn) || (parseFloat(b.team_size || 0) * parseFloat(b.avg_hourly_rate || 0) * parseFloat(b.hours_per_month || 0)) || 0;
    const amountSpent = parseFloat(b.amount_spent) || 0;

    const runway = monthlyBurnRate > 0 && totalBudget > 0 ? Math.round(((totalBudget - amountSpent) / monthlyBurnRate) * 10) / 10 : null;
    const percentSpent = totalBudget > 0 ? Math.round((amountSpent / totalBudget) * 100) : 0;

    res.json({
      totalBudget: totalBudget || null,
      currency: b.currency || 'INR',
      monthlyBurnRate,
      teamSize: b.team_size || 0,
      avgHourlyRate: parseFloat(b.avg_hourly_rate) || 0,
      hoursPerMonth: b.hours_per_month || 0,
      startDate: b.start_date || null,
      notes: b.notes || null,
      amountSpent,
      burn: monthlyBurnRate,
      runway,
      percentSpent,
      remaining: Math.max(0, totalBudget - amountSpent),
    });
  } catch (err) { next(err); }
});

// PATCH Budget — /:owner/:repo/budget
router.patch('/:owner/:repo/budget', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const {
      totalBudget,
      currency,
      monthlyBurnRate,
      teamSize,
      avgHourlyRate,
      hoursPerMonth,
      startDate,
      notes,
      amountSpent,
    } = req.body || {};

    const project = await findProjectByRepo(owner, repo);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Calculate derived burn if not provided
    const derivedMonthlyBurn = monthlyBurnRate || (Number(teamSize || 0) * Number(avgHourlyRate || 0) * Number(hoursPerMonth || 0));

    const result = await pool.query(
      `INSERT INTO project_budget (project_id, budget, monthly_burn, currency, team_size, avg_hourly_rate, hours_per_month, start_date, notes, amount_spent, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (project_id) DO UPDATE SET
         budget = EXCLUDED.budget,
         monthly_burn = EXCLUDED.monthly_burn,
         currency = EXCLUDED.currency,
         team_size = EXCLUDED.team_size,
         avg_hourly_rate = EXCLUDED.avg_hourly_rate,
         hours_per_month = EXCLUDED.hours_per_month,
         start_date = EXCLUDED.start_date,
         notes = EXCLUDED.notes,
         amount_spent = EXCLUDED.amount_spent,
         updated_at = NOW()
       RETURNING *`,
      [
        project.id,
        totalBudget || null,
        derivedMonthlyBurn || 0,
        currency || 'INR',
        teamSize || 0,
        avgHourlyRate || 0,
        hoursPerMonth || 0,
        startDate || null,
        notes || null,
        amountSpent || 0,
      ]
    );

    const b = result.rows[0];
    const burn = parseFloat(b.monthly_burn) || 0;
    const amount = parseFloat(b.budget) || 0;
    const spent = parseFloat(b.amount_spent) || 0;
    const runway = burn > 0 && amount > 0 ? Math.round(((amount - spent) / burn) * 10) / 10 : null;

    res.json({ success: true, budget: b, calculations: { burn, runway, percentSpent: amount > 0 ? Math.round((spent / amount) * 100) : 0 } });
  } catch (err) { next(err); }
});

// GET DORA Metrics — /:owner/:repo/dora
router.get('/:owner/:repo/dora', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const project = await findProjectByRepo(owner, repo);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Deployment Frequency
    const deployFreq = await pool.query(
      `SELECT COUNT(*) as total,
        COUNT(*) / GREATEST(1, EXTRACT(DAY FROM NOW() - COALESCE(MIN(deployed_at), NOW())) / 7.0) as per_week
       FROM deployments WHERE project_id=$1 AND deployed_at >= NOW() - INTERVAL '30 days'`,
      [project.id]
    );

    // Lead Time
    const leadTime = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (d.deployed_at - c.timestamp)) / 3600) as avg_hours
       FROM deployments d
       CROSS JOIN LATERAL (
         SELECT timestamp FROM commits WHERE project_id=$1 ORDER BY timestamp ASC LIMIT 1
       ) c
       WHERE d.project_id=$1 AND d.status='success' AND d.deployed_at >= NOW() - INTERVAL '30 days'`,
      [project.id]
    );

    // Failure Rate
    const failureRate = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status='failure') as failures,
        COUNT(*) as total
       FROM deployments WHERE project_id=$1 AND deployed_at >= NOW() - INTERVAL '30 days'`,
      [project.id]
    );

    const fr = failureRate.rows[0];
    const failurePercent = fr.total > 0 ? (fr.failures / fr.total) * 100 : 0;
    const perWeek = parseFloat(deployFreq.rows[0].per_week) || 0;
    const avgLeadHours = parseFloat(leadTime.rows[0].avg_hours) || 0;

    // Rating tier
    let rating = 'Low';
    if (perWeek >= 7 && avgLeadHours <= 1 && failurePercent <= 5) rating = 'Elite';
    else if (perWeek >= 1 && avgLeadHours <= 24 && failurePercent <= 10) rating = 'High';
    else if (perWeek >= 0.25 && avgLeadHours <= 168 && failurePercent <= 15) rating = 'Medium';

    res.json({
      deployFreq: {
        value: Math.round(perWeek * 100) / 100,
        unit: perWeek > 1 ? 'per day' : 'per week',
      },
      leadTime: {
        value: Math.round(avgLeadHours),
        unit: 'hours',
      },
      failureRate: {
        value: Math.round(failurePercent),
        unit: '%',
      },
      rating,
    });
  } catch (err) { next(err); }
});

module.exports = router;
