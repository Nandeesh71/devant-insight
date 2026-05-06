function createPullsService(client) {
  return {
    async listPulls(owner, repo, query = {}) {
      const result = await client.request('pulls/list', {
        path: { owner, repo },
        query,
      });

      return {
        items: Array.isArray(result.data) ? result.data : [],
        pagination: result.pagination,
      };
    },

    async getPull(owner, repo, pullNumber) {
      const result = await client.request('pulls/get', {
        path: { owner, repo, pull_number: pullNumber },
      });
      return result.data;
    },

    async listPullCommits(owner, repo, pullNumber, query = {}) {
      const result = await client.request('pulls/list-commits', {
        path: { owner, repo, pull_number: pullNumber },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },

    async listPullFiles(owner, repo, pullNumber, query = {}) {
      const result = await client.request('pulls/list-files', {
        path: { owner, repo, pull_number: pullNumber },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },

    async listRequestedReviewers(owner, repo, pullNumber) {
      const result = await client.request('pulls/list-requested-reviewers', {
        path: { owner, repo, pull_number: pullNumber },
      });
      return result.data;
    },

    async listReviews(owner, repo, pullNumber, query = {}) {
      const result = await client.request('pulls/list-reviews', {
        path: { owner, repo, pull_number: pullNumber },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },
  };
}

module.exports = {
  createPullsService,
};
