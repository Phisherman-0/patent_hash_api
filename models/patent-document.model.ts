import { mysqlTable, varchar, int, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const patentDocuments = mysqlTable("patent_documents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  patentId: varchar("patent_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: int("file_size").notNull(),
  hashValue: varchar("hash_value", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPatentDocumentSchema = createInsertSchema(patentDocuments).omit({
  id: true,
  createdAt: true,
});
