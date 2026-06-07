import { mysqlTable, varchar, text, decimal, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const priorArtResults = mysqlTable("prior_art_results", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  patentId: varchar("patent_id", { length: 36 }).notNull(),
  similarPatentId: varchar("similar_patent_id", { length: 36 }),
  externalPatentId: varchar("external_patent_id", { length: 100 }),
  similarityScore: decimal("similarity_score", { precision: 5, scale: 4 }),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});
