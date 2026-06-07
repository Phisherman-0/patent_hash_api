import { mysqlTable, varchar, json, decimal, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const aiAnalysis = mysqlTable("ai_analysis", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  patentId: varchar("patent_id", { length: 36 }).notNull(),
  analysisType: varchar("analysis_type", { length: 100 }).notNull(),
  result: json("result").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAIAnalysisSchema = createInsertSchema(aiAnalysis).omit({
  id: true,
  createdAt: true,
});
