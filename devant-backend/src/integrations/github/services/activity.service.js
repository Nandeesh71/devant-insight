function buildActivityTimeline({ commits = [], pullRequests = [], issues = [], deployments = [] }) {
  const commitItems = commits.map((c) => ({
    type: 'commit',
    at: c?.commit?.author?.date || c?.timestamp || null,
    id: c?.sha || null,
    title: c?.commit?.message || c?.message || 'Commit',
    actor: c?.author?.login || c?.author_github_username || null,
    raw: c,
  }));

  const prItems = pullRequests.map((pr) => ({
    type: 'pull_request',
    at: pr?.created_at || pr?.opened_at || null,
    id: pr?.id || pr?.number || pr?.github_pr_number || null,
    title: pr?.title || 'Pull request',
    actor: pr?.user?.login || pr?.author_github_username || null,
    raw: pr,
  }));

  const issueItems = issues.map((issue) => ({
    type: 'issue',
    at: issue?.created_at || null,
    id: issue?.id || issue?.number || null,
    title: issue?.title || 'Issue',
    actor: issue?.user?.login || null,
    raw: issue,
  }));

  const deploymentItems = deployments.map((dep) => ({
    type: 'deployment',
    at: dep?.created_at || dep?.deployed_at || null,
    id: dep?.id || null,
    title: dep?.environment ? `Deployment (${dep.environment})` : 'Deployment',
    actor: dep?.creator?.login || null,
    raw: dep,
  }));

  return [...commitItems, ...prItems, ...issueItems, ...deploymentItems]
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

module.exports = {
  buildActivityTimeline,
};
