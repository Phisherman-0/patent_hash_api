import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"),
  passwordHash: varchar("password_hash"),
  settings: jsonb("settings").default(sql`'{}'`), // Store user preferences including theme
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patent status enum
export const patentStatusEnum = pgEnum("patent_status", [
  "draft",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "expired"
]);

// Patent category enum
export const patentCategoryEnum = pgEnum("patent_category", [
  "medical_technology",
  "software_ai",
  "renewable_energy",
  "manufacturing",
  "biotechnology",
  "automotive",
  "telecommunications",
  "other"
]);

// Patents table
export const patents = pgTable("patents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: patentCategoryEnum("category").notNull(),
  status: patentStatusEnum("status").default("draft"),
  patentNumber: varchar("patent_number"),
  filePath: varchar("file_path"),
  hashValue: varchar("hash_value"),
  hederaTopicId: varchar("hedera_topic_id"),
  hederaMessageId: varchar("hedera_message_id"),
  hederaTransactionId: varchar("hedera_transaction_id"),
  hederaNftId: varchar("hedera_nft_id"),
  hederaError: text("hedera_error"),
  aiSuggestedCategory: patentCategoryEnum("ai_suggested_category"),
  aiConfidence: decimal("ai_confidence", { precision: 5, scale: 4 }),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  filedAt: timestamp("filed_at"),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patent documents table (for multiple files per patent)
export const patentDocuments = pgTable("patent_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  userId: varchar("user_id").notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  hashValue: varchar("hash_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI analysis results table
export const aiAnalysis = pgTable("ai_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  analysisType: varchar("analysis_type").notNull(), // prior_art, similarity, valuation, classification
  result: jsonb("result").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prior art search results
export const priorArtResults = pgTable("prior_art_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  similarPatentId: varchar("similar_patent_id"),
  externalPatentId: varchar("external_patent_id"),
  similarityScore: decimal("similarity_score", { precision: 5, scale: 4 }),
  title: varchar("title"),
  description: text("description"),
  source: varchar("source"), // internal, uspto, epo, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Blockchain transactions table
export const blockchainTransactions = pgTable("blockchain_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  transactionType: varchar("transaction_type").notNull(), // hash_storage, nft_mint, transfer
  hederaTransactionId: varchar("hedera_transaction_id"),
  hederaTopicId: varchar("hedera_topic_id"),
  hederaMessageId: varchar("hedera_message_id"),
  hashValue: varchar("hash_value"), // Store the hash that was submitted to blockchain
  gasUsed: decimal("gas_used", { precision: 10, scale: 6 }),
  status: varchar("status").default("pending"), // pending, confirmed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Patent activity log
export const patentActivity = pgTable("patent_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patentId: varchar("patent_id").notNull(),
  userId: varchar("user_id").notNull(),
  activityType: varchar("activity_type").notNull(), // created, updated, filed, approved, etc.
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  patents: many(patents),
  activities: many(patentActivity),
}));

export const patentsRelations = relations(patents, ({ one, many }) => ({
  user: one(users, {
    fields: [patents.userId],
    references: [users.id],
  }),
  documents: many(patentDocuments),
  aiAnalyses: many(aiAnalysis),
  priorArtResults: many(priorArtResults),
  blockchainTransactions: many(blockchainTransactions),
  activities: many(patentActivity),
}));

export const patentDocumentsRelations = relations(patentDocuments, ({ one }) => ({
  patent: one(patents, {
    fields: [patentDocuments.patentId],
    references: [patents.id],
  }),
  user: one(users, {
    fields: [patentDocuments.userId],
    references: [users.id],
  }),
}));

export const aiAnalysisRelations = relations(aiAnalysis, ({ one }) => ({
  patent: one(patents, {
    fields: [aiAnalysis.patentId],
    references: [patents.id],
  }),
}));

export const priorArtResultsRelations = relations(priorArtResults, ({ one }) => ({
  patent: one(patents, {
    fields: [priorArtResults.patentId],
    references: [patents.id],
  }),
}));

export const blockchainTransactionsRelations = relations(blockchainTransactions, ({ one }) => ({
  patent: one(patents, {
    fields: [blockchainTransactions.patentId],
    references: [patents.id],
  }),
}));

export const patentActivityRelations = relations(patentActivity, ({ one }) => ({
  patent: one(patents, {
    fields: [patentActivity.patentId],
    references: [patents.id],
  }),
  user: one(users, {
    fields: [patentActivity.userId],
    references: [users.id],
  }),
}));

// Schema types
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertPatent = typeof patents.$inferInsert;
export type Patent = typeof patents.$inferSelect;

export type InsertPatentDocument = typeof patentDocuments.$inferInsert;
export type PatentDocument = typeof patentDocuments.$inferSelect;

export type InsertAIAnalysis = typeof aiAnalysis.$inferInsert;
export type AIAnalysis = typeof aiAnalysis.$inferSelect;

export type InsertPriorArtResult = typeof priorArtResults.$inferInsert;
export type PriorArtResult = typeof priorArtResults.$inferSelect;

export type InsertBlockchainTransaction = typeof blockchainTransactions.$inferInsert;
export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;

export type InsertPatentActivity = typeof patentActivity.$inferInsert;
export type PatentActivity = typeof patentActivity.$inferSelect;

// Zod schemas for validation
export const insertPatentSchema = createInsertSchema(patents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatentDocumentSchema = createInsertSchema(patentDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertAIAnalysisSchema = createInsertSchema(aiAnalysis).omit({
  id: true,
  createdAt: true,
});
