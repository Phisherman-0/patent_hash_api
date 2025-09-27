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
  check,
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
}, (table) => [
  check("valid_role", sql`role IN ('user', 'consultant', 'admin')`)
]);

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

// Wallet connections table for HashPack and other wallet integrations
export const walletConnections = pgTable("wallet_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  walletType: varchar("wallet_type").notNull(), // hashpack, legacy
  accountId: varchar("account_id").notNull(),
  network: varchar("network").notNull(), // testnet, mainnet
  sessionData: jsonb("session_data"), // HashConnect session data
  isActive: boolean("is_active").default(true),
  lastConnected: timestamp("last_connected").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consultants table for consultant-specific information
export const consultants = pgTable("consultants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  specialization: varchar("specialization"),
  bio: text("bio"),
  experienceYears: integer("experience_years").default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  availability: jsonb("availability").default(sql`'{}'`),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointment status enum
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled"
]);

// Appointments table for booking system
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  consultantId: varchar("consultant_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: appointmentStatusEnum("status").default("pending"),
  meetingLink: varchar("meeting_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  check("valid_appointment_status", sql`status IN ('pending', 'confirmed', 'completed', 'cancelled')`)
]);

// Chat rooms table for user-consultant communication
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  consultantId: varchar("consultant_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure unique chat room between user and consultant
  index("idx_user_consultant_unique").on(table.userId, table.consultantId)
]);

// Chat messages table for storing messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  patents: many(patents),
  activities: many(patentActivity),
  walletConnections: many(walletConnections),
}));

export const walletConnectionsRelations = relations(walletConnections, ({ one }) => ({
  user: one(users, {
    fields: [walletConnections.userId],
    references: [users.id],
  }),
}));

export const consultantsRelations = relations(consultants, ({ one, many }) => ({
  user: one(users, {
    fields: [consultants.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  chatRooms: many(chatRooms),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  consultant: one(consultants, {
    fields: [appointments.consultantId],
    references: [consultants.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  user: one(users, {
    fields: [chatRooms.userId],
    references: [users.id],
  }),
  consultant: one(consultants, {
    fields: [chatRooms.consultantId],
    references: [consultants.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chatRoom: one(chatRooms, {
    fields: [chatMessages.chatRoomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
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

// HashPack wallet connection interface
export interface HashPackWalletConfig {
  accountId: string;
  network: 'testnet' | 'mainnet';
  walletType: 'hashpack';
  sessionData?: any; // HashConnect session data
  lastConnected?: string;
}

// Legacy wallet configuration interface (deprecated)
export interface LegacyWalletConfig {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
  walletType: 'legacy';
}

// Combined wallet configuration
export type WalletConfig = HashPackWalletConfig | LegacyWalletConfig;

// User settings interface
export interface UserSettings {
  walletConfig?: WalletConfig;
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  [key: string]: any; // Allow other settings
}

// Consultant interface
export interface Consultant {
  id: string;
  userId: string;
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  availability?: any;
  rating?: number;
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Appointment interface
export interface Appointment {
  id: string;
  userId: string;
  consultantId: string;
  title: string;
  description?: string;
  appointmentDate: Date;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Chat room interface
export interface ChatRoom {
  id: string;
  userId: string;
  consultantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt?: Date;
}

// Schema types
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect & {
  settings?: UserSettings;
};

export type InsertConsultant = typeof consultants.$inferInsert;
export type ConsultantType = typeof consultants.$inferSelect;

export type InsertAppointment = typeof appointments.$inferInsert;
export type AppointmentType = typeof appointments.$inferSelect;

export type InsertChatRoom = typeof chatRooms.$inferInsert;
export type ChatRoomType = typeof chatRooms.$inferSelect;

export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessageType = typeof chatMessages.$inferSelect;

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

export type InsertWalletConnection = typeof walletConnections.$inferInsert;
export type WalletConnection = typeof walletConnections.$inferSelect;

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
