import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
});
