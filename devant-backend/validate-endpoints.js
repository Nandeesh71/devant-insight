#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the OpenAPI spec
const specPath = path.join(__dirname, '../rest-api-description-main/descriptions/api.github.com/api.github.com.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

// All operations used in the codebase
const usedOperations = [
  // repos operations
  'repos/get',
  'repos/list-for-authenticated-user',
  'repos/list-branches',
  'repos/list-collaborators',
  'repos/list-contributors',
  'repos/list-deployments',
  'repos/list-deployment-statuses',
  'repos/list-webhooks',
  'repos/create-webhook',
  'repos/get-webhook',
  'repos/delete-webhook',
  'repos/list-commits',
  'repos/get-commit',
  'repos/compare-commits',
  'repos/list-releases',
  'repos/list-tags',
  
  // pulls operations
  'pulls/list',
  'pulls/get',
  'pulls/list-commits',
  'pulls/list-files',
  'pulls/list-requested-reviewers',
  'pulls/list-reviews',
  
  // issues operations
  'issues/list-for-repo',
  'issues/list-events-for-repo',
  'issues/list-labels-for-repo',
  'issues/list-milestones',
  
  // users operations
  'users/get-authenticated',
  'users/get-by-username',
];

// Extract all operationIds from the spec
const specOperationIds = new Set();
for (const [pathTemplate, pathItem] of Object.entries(spec.paths || {})) {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const operation = pathItem[method];
    if (operation && operation.operationId) {
      specOperationIds.add(operation.operationId);
    }
  }
}

// Verify each operation
console.log('=== GitHub API Endpoint Validation ===\n');

const missing = [];
const valid = [];

for (const operationId of usedOperations) {
  if (specOperationIds.has(operationId)) {
    valid.push(operationId);
    console.log(`✓ ${operationId}`);
  } else {
    missing.push(operationId);
    console.log(`✗ ${operationId} - NOT FOUND IN SPEC`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Valid operations: ${valid.length}/${usedOperations.length}`);
if (missing.length > 0) {
  console.log(`\nMissing operations (${missing.length}):`);
  for (const op of missing) {
    console.log(`  - ${op}`);
  }
  process.exit(1);
} else {
  console.log('All operations are valid!');
  process.exit(0);
}
