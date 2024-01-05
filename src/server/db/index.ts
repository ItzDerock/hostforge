import SQLite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { join } from "path";
import { env } from "~/env";

const globalForDB = globalThis as unknown as {
  db: ReturnType<typeof createDatabaseInstance>;
};

function createDatabaseInstance() {
  const sqlite = new SQLite3(env.DATABASE_PATH);

  // enable WAL mode
  sqlite.pragma("journal_mode = WAL");

  // load uuidv7 extension
  // built from https://github.com/craigpastro/sqlite-uuidv7
  sqlite.loadExtension(
    env.SQLITE_UUIDV7_EXT_PATH ??
      join(
        // cannot use __dirname since this file will change locations when compiled
        process.cwd(),
        "./exts/sqlite-uuidv7",
      ),
  );

  return drizzle(sqlite);
}

export const db = (globalForDB.db ??= createDatabaseInstance());
