import { blob, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const user = sqliteTable("user", {
  id: text("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),

  username: text("username").notNull(),
  password: text("password").notNull(),

  // incase we need a larger number in the future, use a blob that can hold a bigint
  // using $defaultFn otherwise drizzle will try to JSON.stringify the bigint during migrations
  permissions: blob("permissions", { mode: "bigint" }).$defaultFn(() => 0n),
});
