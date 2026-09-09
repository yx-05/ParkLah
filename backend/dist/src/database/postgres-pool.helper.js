"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResilientPostgresPool = createResilientPostgresPool;
exports.getSharedPostgresPool = getSharedPostgresPool;
const pg_1 = require("pg");
let sharedPool = null;
function createResilientPostgresPool(customConfig) {
    if (!process.env.DATABASE_URL) {
        return null;
    }
    const isSupabase = process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_SSL === 'true';
    const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '').replace('&sslmode=require', '');
    const config = {
        connectionString,
        ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ...customConfig,
    };
    const pool = new pg_1.Pool(config);
    pool.on('error', (err) => {
        console.warn('[PostgresPool] Idle connection error caught safely:', err.message);
    });
    return pool;
}
function getSharedPostgresPool() {
    if (!sharedPool && process.env.DATABASE_URL) {
        sharedPool = createResilientPostgresPool();
    }
    return sharedPool;
}
//# sourceMappingURL=postgres-pool.helper.js.map