import { mysqlTable, varchar, json, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
export const walletConnections = mysqlTable("wallet_connections", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    walletType: varchar("wallet_type", { length: 100 }).notNull(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    network: varchar("network", { length: 50 }).notNull(),
    sessionData: json("session_data"),
    isActive: boolean("is_active").default(true),
    lastConnected: timestamp("last_connected").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
