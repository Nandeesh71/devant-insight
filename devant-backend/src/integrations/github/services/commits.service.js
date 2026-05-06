function createCommitsService(client) {
  return {
    async listCommits(owner, repo, query = {}) {
      const result = await client.request('repos/list-commits', {
        path: { owner, repo },
        query,
      });

      return {
        items: Array.isArray(result.data) ? result.data : [],
        pagination: result.pagination,
      };
    },

    async listAllCommits(owner, repo, query = {}, pageLimit = 50) {
      const all = [];
      let page = Number(query.page || 1);
      let remaining = pageLimit;

      while (remaining > 0) {
        const pageResult = await this.listCommits(owner, repo, {
          ...query,
          page,
          per_page: Number(query.per_page || 100),
        });

        const items = pageResult.items;
        if (!items.length) break;

        all.push(...items);
        const hasNext = Boolean(pageResult.pagination?.next);
        if (!hasNext) break;

        page += 1;
        remaining -= 1;
      }

      return all;
    },

    async getCommit(owner, repo, ref) {
      const result = await client.request('repos/get-commit', {
        path: { owner, repo, ref },
      });
      return result.data;
    },

    async compareCommits(owner, repo, basehead) {
      const result = await client.request('repos/compare-commits', {
        path: { owner, repo, basehead },
      });
      return result.data;
    },
  };
}

module.exports = {
  createCommitsService,
};
