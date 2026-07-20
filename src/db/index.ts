import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  const host = process.env.SQL_HOST;
  if (!host) {
    console.warn('SQL_HOST is missing. Database operations will be unavailable.');
    return null;
  }
  return new Pool({
    host: host,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle SQL pool client:', err);
  });
}

// Initialize Drizzle with the pool and schema.
// Note: We cast to any if pool is null to avoid type errors, 
// but queries will fail at runtime if db is used when pool is null.
export const db = pool ? drizzle(pool, { schema }) : null as any;
