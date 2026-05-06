function createIssuesService(client) {
  return {
    async listIssues(owner, repo, query = {}) {
      const result = await client.request('issues/list-for-repo', {
        path: { owner, repo },
        query,
      });

      return {
        items: Array.isArray(result.data) ? result.data : [],
        pagination: result.pagination,
      };
    },

    async listIssueEvents(owner, repo, query = {}) {
      const result = await client.request('issues/list-events-for-repo', {
        path: { owner, repo },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },

    async listLabels(owner, repo, query = {}) {
      const result = await client.request('issues/list-labels-for-repo', {
        path: { owner, repo },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },

    async listMilestones(owner, repo, query = {}) {
      const result = await client.request('issues/list-milestones', {
        path: { owner, repo },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },
  };
}

module.exports = {
  createIssuesService,
};
