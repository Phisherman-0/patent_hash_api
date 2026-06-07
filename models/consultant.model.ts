import { mysqlTable, varchar, text, int, decimal, json, timestamp, boolean } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "./user.model";

export const consultants = mysqlTable("consultants", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  specialization: varchar("specialization", { length: 255 }),
  bio: text("bio"),
  experienceYears: int("experience_years").default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  availability: json("availability").default(sql`'{}'`),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by", { length: 36 }).references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
