function createReleasesService(client) {
  return {
    async listReleases(owner, repo, query = {}) {
      const result = await client.request('repos/list-releases', {
        path: { owner, repo },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },

    async listTags(owner, repo, query = {}) {
      const result = await client.request('repos/list-tags', {
        path: { owner, repo },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },
  };
}

module.exports = {
  createReleasesService,
};
