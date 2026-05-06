const etagCache = new Map();

function makeCacheKey(operationId, url) {
  return `${operationId}:${url}`;
}

function getEtagEntry(operationId, url) {
  return etagCache.get(makeCacheKey(operationId, url)) || null;
}

function setEtagEntry(operationId, url, etag, payload) {
  if (!etag) return;
  etagCache.set(makeCacheKey(operationId, url), {
    etag,
    payload,
    cachedAt: Date.now(),
  });
}

module.exports = {
  getEtagEntry,
  setEtagEntry,
};
