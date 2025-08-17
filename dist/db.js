import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
// Configure pool for both local and Supabase/Vercel deployment
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    // Supabase/Vercel optimizations
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // SSL configuration for production (Supabase requires SSL)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};
export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
