import { mysqlTable, varchar, timestamp, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
export const chatRooms = mysqlTable("chat_rooms", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    consultantId: varchar("consultant_id", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
    index("idx_user_consultant_unique").on(table.userId, table.consultantId)
]);
