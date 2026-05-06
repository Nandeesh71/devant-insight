function createRepositoriesService(client) {
  return {
    async getRepo(owner, repo) {
      const result = await client.request('repos/get', {
        path: { owner, repo },
      });
      return result.data;
    },

    async listUserRepositories(query = {}) {
      const result = await client.request('repos/list-for-authenticated-user', {
        query,
      });
      return result.data;
    },

    async listBranches(owner, repo, query = {}) {
      const result = await client.request('repos/list-branches', {
        path: { owner, repo },
        query,
      });
      return result.data;
    },

    async listCollaborators(owner, repo, query = {}) {
      const result = await client.request('repos/list-collaborators', {
        path: { owner, repo },
        query,
      });
      return result.data;
    },

    async listContributors(owner, repo, query = {}) {
      const result = await client.request('repos/list-contributors', {
        path: { owner, repo },
        query,
      });
      return result.data;
    },
  };
}

module.exports = {
  createRepositoriesService,
};
