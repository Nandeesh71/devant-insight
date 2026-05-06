const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase external connections
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
});

const originalQuery = pool.query.bind(pool);

function isTransientConnectionTimeout(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('timeout exceeded when trying to connect') ||
    message.includes('connection terminated due to connection timeout') ||
    error?.code === 'ETIMEDOUT'
  );
}

pool.query = async (...args) => {
  try {
    return await originalQuery(...args);
  } catch (error) {
    if (!isTransientConnectionTimeout(error)) {
      throw error;
    }

    // Single retry for transient connection timeouts.
    return originalQuery(...args);
  }
};

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

module.exports = pool;
