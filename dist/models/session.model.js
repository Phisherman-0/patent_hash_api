import { mysqlTable, varchar, json, timestamp, index } from "drizzle-orm/mysql-core";
export const sessions = mysqlTable("sessions", {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);
