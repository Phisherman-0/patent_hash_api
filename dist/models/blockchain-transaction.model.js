import { mysqlTable, varchar, decimal, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
export const blockchainTransactions = mysqlTable("blockchain_transactions", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    patentId: varchar("patent_id", { length: 36 }).notNull(),
    transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'register' | 'sign' | 'verify'
    transactionHash: varchar("transaction_hash", { length: 255 }), // Blockchain tx hash (0x...)
    networkName: varchar("network_name", { length: 50 }).default("base-sepolia"), // 'base-sepolia' | 'base'
    blockNumber: varchar("block_number", { length: 50 }),
    gasUsed: decimal("gas_used", { precision: 20, scale: 0 }),
    status: varchar("status", { length: 50 }).default("pending"), // 'pending' | 'confirmed' | 'failed'
    createdAt: timestamp("created_at").defaultNow(),
});
