function createContributorsService(client) {
  return {
    async listContributors(owner, repo, query = {}) {
      const result = await client.request('repos/list-contributors', {
        path: { owner, repo },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },
  };
}

module.exports = {
  createContributorsService,
};
