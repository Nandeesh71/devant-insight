require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  console.log('🚀 Running DevANT database migration...');
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Migration complete — all tables created.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
