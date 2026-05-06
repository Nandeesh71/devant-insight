function createDeploymentsService(client) {
  return {
    async listDeployments(owner, repo, query = {}) {
      const result = await client.request('repos/list-deployments', {
        path: { owner, repo },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },

    async listDeploymentStatuses(owner, repo, deploymentId, query = {}) {
      const result = await client.request('repos/list-deployment-statuses', {
        path: { owner, repo, deployment_id: deploymentId },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },
  };
}

module.exports = {
  createDeploymentsService,
};
