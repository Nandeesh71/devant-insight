function isSecondaryRateLimit(responseData, status) {
  if (status !== 403) return false;
  const message = String(responseData?.message || '').toLowerCase();
  return message.includes('secondary rate limit') || message.includes('abuse');
}

function parseRetryAfterSeconds(headers = {}) {
  const retryAfter = headers['retry-after'];
  const value = Number(retryAfter);
  if (Number.isFinite(value) && value > 0) return value;
  return null;
}

module.exports = {
  isSecondaryRateLimit,
  parseRetryAfterSeconds,
};
