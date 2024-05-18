import type { Config } from "drizzle-kit";

export default {
  out: "./drizzle",
  schema: "./src/server/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? "./data/db.sqlite",
  },
} satisfies Config;
