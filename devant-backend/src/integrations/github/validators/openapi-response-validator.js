const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { loadStableOpenApiSpec } = require('../openapi/loader');
const { dereferenceSchema } = require('../openapi/schema-tools');

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  allowUnionTypes: true,
  validateFormats: false,
});
addFormats(ajv);

const compiledValidatorCache = new Map();

function normalizeSchemaForAjv(schema) {
  /**
   * Additional normalization pass for AJV compatibility.
   * Handles edge cases where nullable appears after dereferencing.
   */
  if (!schema || typeof schema !== 'object') return schema;
  
  if (Array.isArray(schema)) {
    return schema.map((s) => normalizeSchemaForAjv(s));
  }

  const normalized = { ...schema };
  
  // Final pass: nullable without type → anyOf with null
  if (normalized.nullable === true && !normalized.type) {
    delete normalized.nullable;
    return {
      anyOf: [
        Object.keys(normalized).length > 0 ? normalized : {},
        { type: 'null' },
      ],
    };
  }

  // Recursively normalize nested properties
  if (normalized.properties) {
    normalized.properties = Object.fromEntries(
      Object.entries(normalized.properties).map(([k, v]) => [k, normalizeSchemaForAjv(v)])
    );
  }

  if (normalized.items) {
    normalized.items = normalizeSchemaForAjv(normalized.items);
  }

  if (normalized.additionalProperties && typeof normalized.additionalProperties === 'object') {
    normalized.additionalProperties = normalizeSchemaForAjv(normalized.additionalProperties);
  }

  return normalized;
}

function getResponseSchemaForStatus(endpoint, statusCode) {
  const status = String(statusCode);
  const response = endpoint.responses[status] || endpoint.responses.default;
  if (!response || !response.content) return null;

  const jsonContent = response.content['application/json'];
  if (!jsonContent || !jsonContent.schema) return null;

  return jsonContent.schema;
}

function getCompiledValidator(endpoint, statusCode) {
  const cacheKey = `${endpoint.operationId}:${statusCode}`;
  if (compiledValidatorCache.has(cacheKey)) {
    return compiledValidatorCache.get(cacheKey);
  }

  const schema = getResponseSchemaForStatus(endpoint, statusCode);
  if (!schema) {
    compiledValidatorCache.set(cacheKey, null);
    return null;
  }

  const openapi = loadStableOpenApiSpec();
  let resolved = dereferenceSchema(schema, openapi);
  
  // Additional normalization pass for AJV compatibility
  resolved = normalizeSchemaForAjv(resolved);
  
  const validate = ajv.compile(resolved);
  compiledValidatorCache.set(cacheKey, validate);
  return validate;
}

function validateOpenApiResponse(endpoint, statusCode, payload) {
  const validator = getCompiledValidator(endpoint, statusCode);
  if (!validator) {
    return { ok: true, skipped: true, errors: [] };
  }

  const valid = validator(payload);
  if (valid) {
    return { ok: true, skipped: false, errors: [] };
  }

  return {
    ok: false,
    skipped: false,
    errors: validator.errors || [],
  };
}

module.exports = {
  validateOpenApiResponse,
};
