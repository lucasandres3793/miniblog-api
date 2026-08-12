const { Pool } = require('pg');

try {
  require('node:process').loadEnvFile('.env');
} catch {}

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'blog_db',
  user:     process.env.DB_USER     || 'blog_user',
  password: process.env.DB_PASSWORD || 'blog_password_2026',
});

module.exports = pool;
