const axios = require('axios');
const { getEndpoint } = require('../openapi/endpoint-registry');
const { validateOpenApiResponse } = require('../validators/openapi-response-validator');
const { getEtagEntry, setEtagEntry } = require('../cache/etag-cache');
const { extractPagination } = require('../pagination/link-header');
const { isSecondaryRateLimit, parseRetryAfterSeconds } = require('../rate-limit/handler');
const { sleep, computeBackoffMs } = require('../retry/backoff');

const API_VERSION = '2022-11-28';
const BASE_URL = 'https://api.github.com';

function buildPath(pathTemplate, pathParams = {}) {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, key) => {
    if (!(key in pathParams)) {
      throw new Error(`Missing required path parameter: ${key}`);
    }
    return encodeURIComponent(String(pathParams[key]));
  });
}

function toQueryParams(query = {}) {
  const output = {};
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '') continue;
    output[key] = value;
  }
  return output;
}

function makeSchemaError(operationId, validationErrors) {
  const err = new Error(`GitHub OpenAPI schema mismatch for ${operationId}`);
  err.code = 'GITHUB_SCHEMA_MISMATCH';
  err.details = validationErrors;
  return err;
}

function shouldRetry(error) {
  const status = error?.response?.status;
  if (!status) return true;

  if ([429, 500, 502, 503, 504].includes(status)) return true;
  if (status === 403 && isSecondaryRateLimit(error?.response?.data, status)) return true;

  return false;
}

async function executeWithRetry(run, maxAttempts = 4) {
  let attempt = 1;
  let lastError = null;

  while (attempt <= maxAttempts) {
    try {
      return await run(attempt);
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt >= maxAttempts) {
        throw error;
      }

      const retryAfterSeconds = parseRetryAfterSeconds(error?.response?.headers || {});
      const waitMs = retryAfterSeconds
        ? retryAfterSeconds * 1000
        : computeBackoffMs(attempt);
      await sleep(waitMs);
      attempt += 1;
    }
  }

  throw lastError;
}

function createGitHubClient({ token, userAgent = 'DevANT-GitHub-Intelligence' }) {
  const http = axios.create({
    baseURL: BASE_URL,
    timeout: 25_000,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': userAgent,
    },
  });

  if (token) {
    http.defaults.headers.Authorization = `Bearer ${token}`;
  }

  async function request(operationId, input = {}) {
    const endpoint = getEndpoint(operationId);

    const contractResult = endpoint.requestContract.safeParse({
      path: input.path || {},
      query: input.query || {},
      body: input.body,
    });

    if (!contractResult.success) {
      const err = new Error(`Invalid request contract for ${operationId}`);
      err.code = 'GITHUB_REQUEST_CONTRACT_ERROR';
      err.details = contractResult.error.issues;
      throw err;
    }

    const pathParams = contractResult.data.path;
    const queryParams = toQueryParams(contractResult.data.query);

    const urlPath = buildPath(endpoint.pathTemplate, pathParams);
    const fullUrl = `${BASE_URL}${urlPath}`;

    const headers = { ...(input.headers || {}) };

    if (endpoint.deprecated) {
      console.warn(`[GITHUB][DEPRECATED] ${operationId} (${endpoint.method} ${endpoint.pathTemplate})`);
    }

    if (endpoint.method === 'GET') {
      const cached = getEtagEntry(operationId, `${fullUrl}?${new URLSearchParams(queryParams).toString()}`);
      if (cached?.etag) {
        headers['If-None-Match'] = cached.etag;
      }
    }

    const response = await executeWithRetry(async () => {
      return http.request({
        method: endpoint.method,
        url: urlPath,
        params: queryParams,
        data: input.body,
        headers,
        validateStatus: (status) => status < 500 || status === 503,
      });
    });

    const status = response.status;
    const statusString = String(status);

    if (status === 304 && endpoint.method === 'GET') {
      const key = `${fullUrl}?${new URLSearchParams(queryParams).toString()}`;
      const cached = getEtagEntry(operationId, key);
      if (cached) {
        return {
          status,
          data: cached.payload,
          headers: response.headers,
          pagination: extractPagination(response),
          fromCache: true,
        };
      }
    }

    const isSuccess = status >= 200 && status < 300;
    if (!isSuccess) {
      const err = new Error(`GitHub API call failed for ${operationId} (${statusString})`);
      err.code = 'GITHUB_API_ERROR';
      err.status = status;
      err.operationId = operationId;
      err.payload = response.data;
      throw err;
    }

    const validation = validateOpenApiResponse(endpoint, statusString, response.data);
    if (!validation.ok) {
      console.error('[GITHUB][SCHEMA_MISMATCH]', {
        operationId,
        status,
        errors: validation.errors,
      });

      if (process.env.GITHUB_SCHEMA_STRICT === 'true') {
        throw makeSchemaError(operationId, validation.errors);
      }
    }

    if (endpoint.method === 'GET') {
      const etag = response.headers.etag;
      const key = `${fullUrl}?${new URLSearchParams(queryParams).toString()}`;
      setEtagEntry(operationId, key, etag, response.data);
    }

    return {
      status,
      data: response.data,
      headers: response.headers,
      pagination: extractPagination(response),
      fromCache: false,
    };
  }

  return {
    request,
  };
}

module.exports = {
  createGitHubClient,
};
