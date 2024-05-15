import type { Config } from "drizzle-kit";

export default {
  out: "./drizzle",
  schema: "./src/server/db/schema/index.ts",
  driver: "better-sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? "./data/db.sqlite",
  },
} satisfies Config;
