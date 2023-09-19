import { blob, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const userModel = sqliteTable(
  "user",
  {
    id: text("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),

    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    mfaSecret: text("mfaSecret"),

    // incase we need a larger number in the future, use a blob that can hold a bigint
    // using $defaultFn otherwise drizzle will try to JSON.stringify the bigint during migrations
    permissions: blob("permissions", { mode: "bigint" }).$defaultFn(() => 0n),
  },
  (table) => {
    return {
      usernameIdx: index("username_idx").on(table.username),
    };
  }
);
