function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoffMs(attempt, baseMs = 500, capMs = 12_000) {
  const jitter = Math.floor(Math.random() * 250);
  const value = Math.min(capMs, baseMs * (2 ** Math.max(0, attempt - 1)) + jitter);
  return value;
}

module.exports = {
  sleep,
  computeBackoffMs,
};
