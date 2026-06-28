import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from "drizzle-orm/mysql2/migrator";
import * as schema from "./models/index";
import path from "path";
import { fileURLToPath } from "url";
// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for MySQL.");
}
// Configure pool for MySQL (XAMPP)
export const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 2,
    waitForConnections: true,
    queueLimit: 0,
});
export const db = drizzle(pool, { schema, mode: "default" });
/**
 * Automatically synchronize the database schema with the models.
 * This runs any pending migrations found in the /drizzle folder.
 */
export async function initializeDatabase() {
    try {
        // Check connection first
        const conn = await pool.getConnection();
        const dbUrl = process.env.DATABASE_URL;
        const match = dbUrl.match(/mysql:\/\/[^@]+@([^/]+)\/(.+)/);
        const host = match?.[1] ?? 'unknown';
        const dbName = match?.[2]?.split('?')[0] ?? 'unknown';
        console.log(`🟢 MySQL connection verified: host=${host}  db=${dbName}`);
        conn.release();
        // Run migrations
        console.log("🚀 Checking database schema for updates...");
        await migrate(db, {
            migrationsFolder: path.resolve(__dirname, "./drizzle")
        });
        console.log("✅ Database schema is up to date.");
    }
    catch (err) {
        console.error(`🔴 Database initialization FAILED:`);
        console.error(`   ${err.message}`);
        if (err.message.includes("is not running") || err.code === 'ECONNREFUSED') {
            console.error(`   TIP: Is XAMPP MySQL running?`);
        }
        // In dev, we might want to continue even if DB is down initially, 
        // but typically we want to stop if migrations failed.
    }
}
// Test the connection on startup and log the result (deprecated in favor of initializeDatabase)
// but kept for backward compatibility if needed elsewhere
pool.getConnection()
    .then((conn) => {
    conn.release();
})
    .catch(() => { });
