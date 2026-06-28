import { mysqlTable, varchar, text, json, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
export const patentActivity = mysqlTable("patent_activity", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    patentId: varchar("patent_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    activityType: varchar("activity_type", { length: 100 }).notNull(),
    description: text("description"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
});
