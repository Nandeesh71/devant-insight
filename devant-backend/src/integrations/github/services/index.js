const { createGitHubClient } = require('../client/github-client');
const { createRepositoriesService } = require('./repositories.service');
const { createCommitsService } = require('./commits.service');
const { createPullsService } = require('./pulls.service');
const { createIssuesService } = require('./issues.service');
const { createDeploymentsService } = require('./deployments.service');
const { createReleasesService } = require('./releases.service');
const { createContributorsService } = require('./contributors.service');
const { createWebhooksService } = require('./webhooks.service');

function createGitHubServices(token) {
  const client = createGitHubClient({ token });

  return {
    client,
    repositories: createRepositoriesService(client),
    commits: createCommitsService(client),
    pulls: createPullsService(client),
    issues: createIssuesService(client),
    deployments: createDeploymentsService(client),
    releases: createReleasesService(client),
    contributors: createContributorsService(client),
    webhooks: createWebhooksService(client),
  };
}

module.exports = {
  createGitHubServices,
};
