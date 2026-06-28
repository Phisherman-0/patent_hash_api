import { mysqlTable, varchar, text, int, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
export const appointments = mysqlTable("appointments", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    consultantId: varchar("consultant_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    appointmentDate: timestamp("appointment_date").notNull(),
    duration: int("duration").notNull(),
    status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending"),
    meetingLink: varchar("meeting_link", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
