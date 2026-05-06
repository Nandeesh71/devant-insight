const fs = require('fs');
const path = require('path');

// Bundled spec paths (priority: internal → env var → external fallback)
// Path: src/integrations/github/openapi/loader.js → ../../../../github-openapi/
const BUNDLED_STABLE_SPEC_PATH = path.join(
  __dirname,
  '../../../../github-openapi/api.github.com.2022-11-28.json'
);

// External spec paths (for development or alternative layouts)
const EXTERNAL_STABLE_SPEC_RELATIVE_PATH = path.join(
  '..',
  'rest-api-description-main',
  'descriptions',
  'api.github.com',
  'api.github.com.2022-11-28.json'
);

const EXTERNAL_NEXT_SPEC_RELATIVE_PATH = path.join(
  '..',
  'rest-api-description-main',
  'descriptions-next',
  'api.github.com',
  'api.github.com.json'
);

let stableSpecCache = null;
let nextSpecCache = null;

function resolveSpecPath(mode = 'stable') {
  const root = process.cwd();

  if (mode === 'next') {
    return process.env.GITHUB_OPENAPI_NEXT_SPEC_PATH
      ? path.resolve(process.env.GITHUB_OPENAPI_NEXT_SPEC_PATH)
      : path.resolve(root, EXTERNAL_NEXT_SPEC_RELATIVE_PATH);
  }

  // Bundled-first strategy: check internal, then env var, then external fallback
  if (fs.existsSync(BUNDLED_STABLE_SPEC_PATH)) {
    return BUNDLED_STABLE_SPEC_PATH;
  }

  if (process.env.GITHUB_OPENAPI_SPEC_PATH) {
    return path.resolve(process.env.GITHUB_OPENAPI_SPEC_PATH);
  }

  // Fallback for development environment (sibling directory layout)
  return path.resolve(root, EXTERNAL_STABLE_SPEC_RELATIVE_PATH);
}

function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    const bundledExists = fs.existsSync(BUNDLED_STABLE_SPEC_PATH);
    const envVarSet = !!process.env.GITHUB_OPENAPI_SPEC_PATH;
    
    let hint = '';
    if (!bundledExists && !envVarSet) {
      hint = ` Did you forget to copy github-openapi/api.github.com.2022-11-28.json or set GITHUB_OPENAPI_SPEC_PATH?`;
    } else if (!bundledExists && envVarSet) {
      hint = ` GITHUB_OPENAPI_SPEC_PATH is set but points to missing file: ${process.env.GITHUB_OPENAPI_SPEC_PATH}`;
    }
    
    throw new Error(`GitHub OpenAPI file not found: ${filePath}${hint}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function loadStableOpenApiSpec() {
  if (stableSpecCache) return stableSpecCache;

  const specPath = resolveSpecPath('stable');
  const spec = loadJsonFile(specPath);
  if (spec.openapi !== '3.0.3') {
    throw new Error(`Expected GitHub stable OpenAPI 3.0.3, found ${spec.openapi || 'unknown'}`);
  }

  stableSpecCache = spec;
  return stableSpecCache;
}

function loadNextOpenApiSpec() {
  if (nextSpecCache) return nextSpecCache;

  const specPath = resolveSpecPath('next');
  nextSpecCache = loadJsonFile(specPath);
  return nextSpecCache;
}

module.exports = {
  loadStableOpenApiSpec,
  loadNextOpenApiSpec,
  resolveSpecPath,
};
