import { relations } from "drizzle-orm";
import { sessionModel } from "./session";
import { userModel } from "./user";

export const sessionRelations = relations(sessionModel, ({ one }) => ({
  user: one(userModel, {
    fields: [sessionModel.userId],
    references: [userModel.id],
  }),
}));

export const userRelations = relations(sessionModel, ({ many }) => ({
  sessions: many(sessionModel),
}));
