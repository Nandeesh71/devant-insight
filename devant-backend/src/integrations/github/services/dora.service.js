function computeDoraMetrics({ pullRequests = [], deployments = [], now = new Date() }) {
  const merged = pullRequests.filter((pr) => pr?.merged_at);

  const deployedByWeek = new Map();
  for (const dep of deployments) {
    const date = dep?.deployed_at ? new Date(dep.deployed_at) : null;
    if (!date || Number.isNaN(date.getTime())) continue;
    const weekKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    deployedByWeek.set(weekKey, (deployedByWeek.get(weekKey) || 0) + 1);
  }

  const deploymentFrequency = deployedByWeek.size ? deployments.length / deployedByWeek.size : 0;

  const leadTimesHours = merged
    .map((pr) => {
      const opened = pr?.created_at ? new Date(pr.created_at) : null;
      const mergedAt = pr?.merged_at ? new Date(pr.merged_at) : null;
      if (!opened || !mergedAt || Number.isNaN(opened.getTime()) || Number.isNaN(mergedAt.getTime())) {
        return null;
      }
      return Math.max(0, (mergedAt.getTime() - opened.getTime()) / 3_600_000);
    })
    .filter((value) => Number.isFinite(value));

  const leadTimeForChanges = leadTimesHours.length
    ? leadTimesHours.reduce((sum, value) => sum + value, 0) / leadTimesHours.length
    : null;

  const failures = deployments.filter((d) => String(d?.status || '').toLowerCase() === 'failure').length;
  const changeFailureRate = deployments.length ? failures / deployments.length : 0;

  const successful = deployments
    .filter((d) => String(d?.status || '').toLowerCase() === 'success')
    .sort((a, b) => new Date(a.deployed_at || now).getTime() - new Date(b.deployed_at || now).getTime());

  let mttrHours = null;
  const failed = deployments
    .filter((d) => String(d?.status || '').toLowerCase() === 'failure')
    .sort((a, b) => new Date(a.deployed_at || now).getTime() - new Date(b.deployed_at || now).getTime());

  if (failed.length > 0 && successful.length > 0) {
    const recoveries = [];
    for (const fail of failed) {
      const failAt = new Date(fail.deployed_at || now).getTime();
      const recovery = successful.find((ok) => new Date(ok.deployed_at || now).getTime() > failAt);
      if (!recovery) continue;
      const deltaHours = (new Date(recovery.deployed_at).getTime() - failAt) / 3_600_000;
      if (Number.isFinite(deltaHours) && deltaHours >= 0) recoveries.push(deltaHours);
    }

    if (recoveries.length > 0) {
      mttrHours = recoveries.reduce((sum, value) => sum + value, 0) / recoveries.length;
    }
  }

  return {
    deployment_frequency: deploymentFrequency,
    lead_time_for_changes_hours: leadTimeForChanges,
    change_failure_rate: changeFailureRate,
    mean_time_to_recovery_hours: mttrHours,
  };
}

module.exports = {
  computeDoraMetrics,
};
