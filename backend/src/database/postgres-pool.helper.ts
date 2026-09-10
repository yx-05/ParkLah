import { Pool, PoolConfig } from 'pg';

let sharedPool: Pool | null = null;

export function createResilientPostgresPool(customConfig?: Partial<PoolConfig>): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const isSupabase =
    process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_SSL === 'true';
  const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '').replace(
    '&sslmode=require',
    '',
  );

  const config: PoolConfig = {
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ...customConfig,
  };

  const pool = new Pool(config);

  // Crucial: Handle idle client errors so unexpected TCP drops/timeouts from Supabase pooler
  // do not trigger Node.js unhandled 'error' event and crash the process.
  pool.on('error', (err) => {
    console.warn('[PostgresPool] Idle connection error caught safely:', err.message);
  });

  return pool;
}

export function getSharedPostgresPool(): Pool | null {
  if (!sharedPool && process.env.DATABASE_URL) {
    sharedPool = createResilientPostgresPool();
  }
  return sharedPool;
}
