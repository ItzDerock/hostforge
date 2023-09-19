import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSessionId } from "../../utils/crypto";

export const sessionModel = sqliteTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createSessionId()),

  userId: text("user_id").notNull(),
  lastIp: text("last_ip").notNull(),
});
