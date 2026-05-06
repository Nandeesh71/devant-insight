const { z } = require('zod');

const repositorySchema = z.object({
  id: z.number(),
  full_name: z.string().optional(),
});

const pushEventSchema = z.object({
  repository: repositorySchema,
  after: z.string().optional(),
  commits: z.array(
    z.object({
      id: z.string(),
      message: z.string().optional(),
      timestamp: z.string().optional(),
      author: z.object({
        name: z.string().optional(),
        username: z.string().optional(),
      }).optional(),
      added: z.array(z.string()).optional(),
      modified: z.array(z.string()).optional(),
      removed: z.array(z.string()).optional(),
    })
  ).optional(),
});

const pullRequestEventSchema = z.object({
  action: z.string(),
  repository: repositorySchema,
  pull_request: z.object({
    number: z.number(),
    title: z.string().optional(),
    state: z.string().optional(),
    merged: z.boolean().optional(),
    merged_at: z.string().nullable().optional(),
    merge_commit_sha: z.string().nullable().optional(),
    created_at: z.string().optional(),
    user: z.object({ login: z.string().optional() }).optional(),
    requested_reviewers: z.array(z.object({ login: z.string().optional() })).optional(),
  }),
});

const issuesEventSchema = z.object({
  action: z.string(),
  repository: repositorySchema,
  issue: z.object({
    number: z.number(),
    state: z.string().optional(),
    title: z.string().optional(),
    created_at: z.string().optional(),
    closed_at: z.string().nullable().optional(),
    user: z.object({ login: z.string().optional() }).optional(),
  }),
});

const deploymentEventSchema = z.object({
  repository: repositorySchema,
  deployment: z.object({
    id: z.number().optional(),
    environment: z.string().optional(),
    created_at: z.string().optional(),
    ref: z.string().optional(),
  }),
});

const releaseEventSchema = z.object({
  action: z.string().optional(),
  repository: repositorySchema,
  release: z.object({
    id: z.number().optional(),
    tag_name: z.string().optional(),
    name: z.string().nullable().optional(),
    draft: z.boolean().optional(),
    prerelease: z.boolean().optional(),
    published_at: z.string().nullable().optional(),
  }),
});

const deploymentStatusEventSchema = z.object({
  repository: repositorySchema,
  deployment: z.object({
    environment: z.string().optional(),
    ref: z.string().optional(),
  }).optional(),
  deployment_status: z.object({
    state: z.string(),
    created_at: z.string().optional(),
    log_url: z.string().nullable().optional(),
  }),
});

const webhookEventValidators = {
  push: pushEventSchema,
  pull_request: pullRequestEventSchema,
  issues: issuesEventSchema,
  deployment: deploymentEventSchema,
  release: releaseEventSchema,
  deployment_status: deploymentStatusEventSchema,
};

function validateWebhookPayload(event, payload) {
  const validator = webhookEventValidators[event];
  if (!validator) return { ok: true, skipped: true, data: payload };

  const parsed = validator.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, skipped: false, errors: parsed.error.issues };
  }

  return { ok: true, skipped: false, data: parsed.data };
}

module.exports = {
  validateWebhookPayload,
};
