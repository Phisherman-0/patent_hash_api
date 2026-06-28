import mysql from 'mysql2/promise';
import * as schema from "./models/index";
export declare const pool: mysql.Pool;
export declare const db: import("drizzle-orm/mysql2").MySql2Database<typeof schema> & {
    $client: mysql.Pool;
};
/**
 * Automatically synchronize the database schema with the models.
 * This runs any pending migrations found in the /drizzle folder.
 */
export declare function initializeDatabase(): Promise<void>;
//# sourceMappingURL=db.d.ts.map