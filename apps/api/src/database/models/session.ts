import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSessionId } from "../../utils/crypto";
import { relations } from "drizzle-orm";
import { user } from "./user";

export const session = sqliteTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createSessionId()),

  userId: text("user_id").notNull().unique(),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
