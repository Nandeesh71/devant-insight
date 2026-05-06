#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the OpenAPI spec
const specPath = path.join(__dirname, '../rest-api-description-main/descriptions/api.github.com/api.github.com.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

// All operations used in the codebase with their expected details
const usedOperations = [
  // repos operations
  { id: 'repos/get', method: 'GET', expectedPath: '/repos/{owner}/{repo}' },
  { id: 'repos/list-for-authenticated-user', method: 'GET', expectedPath: '/user/repos' },
  { id: 'repos/list-branches', method: 'GET', expectedPath: '/repos/{owner}/{repo}/branches' },
  { id: 'repos/list-collaborators', method: 'GET', expectedPath: '/repos/{owner}/{repo}/collaborators' },
  { id: 'repos/list-contributors', method: 'GET', expectedPath: '/repos/{owner}/{repo}/contributors' },
  { id: 'repos/list-deployments', method: 'GET', expectedPath: '/repos/{owner}/{repo}/deployments' },
  { id: 'repos/list-deployment-statuses', method: 'GET', expectedPath: '/repos/{owner}/{repo}/deployments/{deployment_id}/statuses' },
  { id: 'repos/list-webhooks', method: 'GET', expectedPath: '/repos/{owner}/{repo}/hooks' },
  { id: 'repos/create-webhook', method: 'POST', expectedPath: '/repos/{owner}/{repo}/hooks' },
  { id: 'repos/get-webhook', method: 'GET', expectedPath: '/repos/{owner}/{repo}/hooks/{hook_id}' },
  { id: 'repos/delete-webhook', method: 'DELETE', expectedPath: '/repos/{owner}/{repo}/hooks/{hook_id}' },
  { id: 'repos/list-commits', method: 'GET', expectedPath: '/repos/{owner}/{repo}/commits' },
  { id: 'repos/get-commit', method: 'GET', expectedPath: '/repos/{owner}/{repo}/commits/{ref}' },
  { id: 'repos/compare-commits', method: 'GET', expectedPath: '/repos/{owner}/{repo}/compare/{basehead}' },
  { id: 'repos/list-releases', method: 'GET', expectedPath: '/repos/{owner}/{repo}/releases' },
  { id: 'repos/list-tags', method: 'GET', expectedPath: '/repos/{owner}/{repo}/tags' },
  
  // pulls operations
  { id: 'pulls/list', method: 'GET', expectedPath: '/repos/{owner}/{repo}/pulls' },
  { id: 'pulls/get', method: 'GET', expectedPath: '/repos/{owner}/{repo}/pulls/{pull_number}' },
  { id: 'pulls/list-commits', method: 'GET', expectedPath: '/repos/{owner}/{repo}/pulls/{pull_number}/commits' },
  { id: 'pulls/list-files', method: 'GET', expectedPath: '/repos/{owner}/{repo}/pulls/{pull_number}/files' },
  { id: 'pulls/list-requested-reviewers', method: 'GET', expectedPath: '/repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers' },
  { id: 'pulls/list-reviews', method: 'GET', expectedPath: '/repos/{owner}/{repo}/pulls/{pull_number}/reviews' },
  
  // issues operations
  { id: 'issues/list-for-repo', method: 'GET', expectedPath: '/repos/{owner}/{repo}/issues' },
  { id: 'issues/list-events-for-repo', method: 'GET', expectedPath: '/repos/{owner}/{repo}/issues/events' },
  { id: 'issues/list-labels-for-repo', method: 'GET', expectedPath: '/repos/{owner}/{repo}/labels' },
  { id: 'issues/list-milestones', method: 'GET', expectedPath: '/repos/{owner}/{repo}/milestones' },
  
  // users operations
  { id: 'users/get-authenticated', method: 'GET', expectedPath: '/user' },
  { id: 'users/get-by-username', method: 'GET', expectedPath: '/users/{username}' },
];

// Create a map of operationIds to their path and method
const specEndpoints = new Map();
for (const [pathTemplate, pathItem] of Object.entries(spec.paths || {})) {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const operation = pathItem[method];
    if (operation && operation.operationId) {
      specEndpoints.set(operation.operationId, {
        path: pathTemplate,
        method: method.toUpperCase(),
        operation,
      });
    }
  }
}

// Verify each operation
console.log('=== Detailed GitHub API Endpoint Validation ===\n');

let issues = 0;
const errors = [];

for (const operationInfo of usedOperations) {
  const specEndpoint = specEndpoints.get(operationInfo.id);
  
  if (!specEndpoint) {
    console.log(`✗ ${operationInfo.id} - NOT FOUND IN SPEC`);
    errors.push(`${operationInfo.id} - NOT FOUND IN SPEC`);
    issues++;
    continue;
  }

  // Check method
  if (specEndpoint.method !== operationInfo.method) {
    console.log(`✗ ${operationInfo.id} - METHOD MISMATCH: expected ${operationInfo.method}, got ${specEndpoint.method}`);
    errors.push(`${operationInfo.id} - METHOD MISMATCH: expected ${operationInfo.method}, got ${specEndpoint.method}`);
    issues++;
    continue;
  }

  // Check path
  if (specEndpoint.path !== operationInfo.expectedPath) {
    console.log(`✗ ${operationInfo.id} - PATH MISMATCH: expected ${operationInfo.expectedPath}, got ${specEndpoint.path}`);
    errors.push(`${operationInfo.id} - PATH MISMATCH: expected ${operationInfo.expectedPath}, got ${specEndpoint.path}`);
    issues++;
    continue;
  }

  // Get parameters
  const pathParams = Array.isArray(specEndpoint.operation.parameters) 
    ? specEndpoint.operation.parameters.filter(p => p.in === 'path').map(p => p.name)
    : [];
  const queryParams = Array.isArray(specEndpoint.operation.parameters)
    ? specEndpoint.operation.parameters.filter(p => p.in === 'query').map(p => p.name)
    : [];

  console.log(`✓ ${operationInfo.id}`);
  console.log(`  Path: ${specEndpoint.path}`);
  console.log(`  Method: ${specEndpoint.method}`);
  if (pathParams.length > 0) console.log(`  Path params: ${pathParams.join(', ')}`);
  if (queryParams.length > 0) console.log(`  Query params (optional): ${queryParams.slice(0, 5).join(', ')}${queryParams.length > 5 ? '...' : ''}`);
  console.log('');
}

console.log(`=== Summary ===`);
console.log(`Total endpoints: ${usedOperations.length}`);
console.log(`Valid: ${usedOperations.length - issues}`);
console.log(`Issues: ${issues}`);

if (issues > 0) {
  console.log(`\nErrors found:`);
  for (const error of errors) {
    console.log(`  - ${error}`);
  }
  process.exit(1);
} else {
  console.log('\n✓ All endpoints are correctly configured!');
  process.exit(0);
}
