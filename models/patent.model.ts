import { mysqlTable, varchar, text, mysqlEnum, decimal, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const patents = mysqlTable("patents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["medical_technology", "software_ai", "renewable_energy", "manufacturing", "biotechnology", "automotive", "telecommunications", "other"]).notNull(),
  status: mysqlEnum("status", ["draft", "pending", "under_review", "approved", "rejected", "expired"]).default("draft"),
  patentNumber: varchar("patent_number", { length: 100 }),
  filePath: varchar("file_path", { length: 500 }),
  hashValue: varchar("hash_value", { length: 255 }),
  // Blockchain fields
  blockchainTxHash: varchar("blockchain_tx_hash", { length: 255 }),   // Transaction hash on Base (0x...)
  networkName: varchar("network_name", { length: 50 }),             // 'base-sepolia' | 'base'
  blockchainStatus: varchar("blockchain_status", { length: 50 }),   // 'pending' | 'confirmed' | 'failed'
  // AI analysis fields
  aiSuggestedCategory: mysqlEnum("ai_suggested_category", ["medical_technology", "software_ai", "renewable_energy", "manufacturing", "biotechnology", "automotive", "telecommunications", "other"]),
  aiConfidence: decimal("ai_confidence", { precision: 5, scale: 4 }),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  // Signing fields (wallet-based, public key from MetaMask/WalletConnect)
  contractSignature: text("contract_signature"),
  signerWalletAddress: varchar("signer_wallet_address", { length: 255 }),
  signedAt: timestamp("signed_at"),
  filedAt: timestamp("filed_at"),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatentSchema = createInsertSchema(patents);
