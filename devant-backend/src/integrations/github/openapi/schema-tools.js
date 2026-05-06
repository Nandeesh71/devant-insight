function getByJsonPointer(document, pointer) {
  if (!pointer || pointer === '#') return document;
  if (!pointer.startsWith('#/')) {
    throw new Error(`Only local JSON pointers are supported: ${pointer}`);
  }

  return pointer
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((acc, key) => {
      if (acc == null || !(key in acc)) {
        throw new Error(`Invalid JSON pointer ${pointer}`);
      }
      return acc[key];
    }, document);
}

function normalizeOpenApiSchema(schema) {
  /**
   * Normalize OpenAPI schemas to be AJV-compatible.
   * OpenAPI 3.0.3 uses `nullable` but JSON Schema requires explicit handling.
   */
  if (!schema || typeof schema !== 'object') return schema;

  if (Array.isArray(schema)) {
    return schema.map((s) => normalizeOpenApiSchema(s));
  }

  const normalized = {};
  for (const [key, value] of Object.entries(schema)) {
    normalized[key] = Array.isArray(value) ? value.map((v) => normalizeOpenApiSchema(v)) : value;
  }

  // OpenAPI nullable: true → JSON Schema anyOf with null
  if (normalized.nullable === true) {
    delete normalized.nullable;
    const withoutNullable = normalized;
    
    // If no type specified, default to allowing any value or null
    if (!withoutNullable.type && !withoutNullable.$ref && !withoutNullable.oneOf && !withoutNullable.anyOf) {
      return { anyOf: [withoutNullable, { type: 'null' }] };
    }
    
    // If type specified, wrap in anyOf with null
    return {
      anyOf: [withoutNullable, { type: 'null' }],
    };
  }

  return normalized;
}

function dereferenceSchema(schema, document, seen = new Set()) {
  if (!schema || typeof schema !== 'object') return schema;

  if (schema.$ref) {
    if (seen.has(schema.$ref)) {
      throw new Error(`Circular OpenAPI schema reference: ${schema.$ref}`);
    }
    seen.add(schema.$ref);
    const target = getByJsonPointer(document, schema.$ref);
    return dereferenceSchema(target, document, seen);
  }

  if (Array.isArray(schema)) {
    return schema.map((entry) => dereferenceSchema(entry, document, new Set(seen)));
  }

  const next = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'example' || key === 'examples') {
      next[key] = value;
      continue;
    }
    next[key] = dereferenceSchema(value, document, new Set(seen));
  }

  // Normalize OpenAPI-specific keywords
  return normalizeOpenApiSchema(next);
}

function resolveParameter(param, document) {
  if (!param) return null;
  if (param.$ref) {
    return getByJsonPointer(document, param.$ref);
  }
  return param;
}

module.exports = {
  getByJsonPointer,
  dereferenceSchema,
  resolveParameter,
};
