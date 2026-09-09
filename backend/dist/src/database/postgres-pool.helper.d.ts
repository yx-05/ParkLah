import { Pool, PoolConfig } from 'pg';
export declare function createResilientPostgresPool(customConfig?: Partial<PoolConfig>): Pool | null;
export declare function getSharedPostgresPool(): Pool | null;
