const SUPPORTED_EVENTS = ['push', 'pull_request', 'issues', 'deployment', 'release'];

function createWebhooksService(client) {
  return {
    async listWebhooks(owner, repo, query = {}) {
      const result = await client.request('repos/list-webhooks', {
        path: { owner, repo },
        query,
      });
      return Array.isArray(result.data) ? result.data : [];
    },

    async createWebhook(owner, repo, url, secret, events = SUPPORTED_EVENTS) {
      const result = await client.request('repos/create-webhook', {
        path: { owner, repo },
        body: {
          name: 'web',
          active: true,
          events,
          config: {
            url,
            content_type: 'json',
            secret,
            insecure_ssl: '0',
          },
        },
      });
      return result.data;
    },

    async getWebhook(owner, repo, hookId) {
      const result = await client.request('repos/get-webhook', {
        path: { owner, repo, hook_id: hookId },
      });
      return result.data;
    },

    async deleteWebhook(owner, repo, hookId) {
      await client.request('repos/delete-webhook', {
        path: { owner, repo, hook_id: hookId },
      });
      return { success: true };
    },

    async ensureWebhook(owner, repo, url, secret) {
      const hooks = await this.listWebhooks(owner, repo, { per_page: 100, page: 1 });
      const existing = hooks.find((hook) => hook?.config?.url === url);
      if (existing) return existing;
      return this.createWebhook(owner, repo, url, secret, SUPPORTED_EVENTS);
    },
  };
}

module.exports = {
  createWebhooksService,
  SUPPORTED_EVENTS,
};
