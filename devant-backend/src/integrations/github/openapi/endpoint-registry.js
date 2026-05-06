const { z } = require('zod');
const { loadStableOpenApiSpec } = require('./loader');
const { resolveParameter } = require('./schema-tools');

const REQUIRED_OPERATION_IDS = [
  'repos/get',
  'repos/list-for-authenticated-user',
  'repos/list-branches',
  'repos/list-collaborators',
  'repos/list-commits',
  'repos/get-commit',
  'repos/compare-commits',
  'repos/list-contributors',
  'repos/list-deployments',
  'repos/list-deployment-statuses',
  'repos/list-releases',
  'repos/list-tags',
  'repos/list-webhooks',
  'repos/create-webhook',
  'repos/get-webhook',
  'repos/delete-webhook',
  'pulls/list',
  'pulls/get',
  'pulls/list-requested-reviewers',
  'pulls/list-reviews',
  'pulls/list-commits',
  'pulls/list-files',
  'issues/list-for-repo',
  'issues/list-events-for-repo',
  'issues/list-labels-for-repo',
  'issues/list-milestones',
];

let registryCache = null;

function makeZodTypeFromOpenApiSchema(schema) {
  const type = schema?.type;

  if (!type && schema?.enum) {
    return z.enum(schema.enum);
  }
  if (!type) return z.any();

  if (type === 'string') {
    if (Array.isArray(schema.enum) && schema.enum.length > 0) {
      return z.enum(schema.enum);
    }
    return z.string();
  }
  if (type === 'integer' || type === 'number') {
    return z.coerce.number();
  }
  if (type === 'boolean') {
    return z.coerce.boolean();
  }
  if (type === 'array') {
    return z.array(makeZodTypeFromOpenApiSchema(schema.items || {}));
  }
  if (type === 'object') {
    return z.record(z.any());
  }

  return z.any();
}

function buildRequestContract(parameters = []) {
  const pathShape = {};
  const queryShape = {};

  for (const parameter of parameters) {
    const schema = parameter.schema || {};
    const zodType = makeZodTypeFromOpenApiSchema(schema);
    const required = Boolean(parameter.required);

    if (parameter.in === 'path') {
      pathShape[parameter.name] = required ? zodType : zodType.optional();
    }

    if (parameter.in === 'query') {
      queryShape[parameter.name] = required ? zodType : zodType.optional();
    }
  }

  return z.object({
    path: z.object(pathShape).default({}),
    query: z.object(queryShape).default({}),
    body: z.any().optional(),
  });
}

function buildEndpointRegistry() {
  if (registryCache) return registryCache;

  const spec = loadStableOpenApiSpec();
  const endpointRegistry = new Map();

  for (const [pathTemplate, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const operation = pathItem[method];
      if (!operation || !operation.operationId) continue;

      const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
      const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : [];

      const mergedParameters = [...pathParameters, ...operationParameters]
        .map((param) => resolveParameter(param, spec))
        .filter(Boolean);

      endpointRegistry.set(operation.operationId, {
        operationId: operation.operationId,
        method: method.toUpperCase(),
        pathTemplate,
        deprecated: Boolean(operation.deprecated),
        tags: operation.tags || [],
        parameters: mergedParameters,
        requestContract: buildRequestContract(mergedParameters),
        responses: operation.responses || {},
      });
    }
  }

  const missing = REQUIRED_OPERATION_IDS.filter((operationId) => !endpointRegistry.has(operationId));
  if (missing.length > 0) {
    throw new Error(`GitHub OpenAPI registry missing required operationIds: ${missing.join(', ')}`);
  }

  registryCache = endpointRegistry;
  return registryCache;
}

function getEndpoint(operationId) {
  const registry = buildEndpointRegistry();
  const endpoint = registry.get(operationId);

  if (!endpoint) {
    throw new Error(`Unknown GitHub OpenAPI operationId: ${operationId}`);
  }

  return endpoint;
}

module.exports = {
  buildEndpointRegistry,
  getEndpoint,
  REQUIRED_OPERATION_IDS,
};
