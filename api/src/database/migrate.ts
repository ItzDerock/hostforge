import { db } from ".";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

/**
 * Preps the database (WAL mode) and runs migrations
 */
export function prepDatabase() {
  migrate(db, { migrationsFolder: "./migrations" });
  return;
}
