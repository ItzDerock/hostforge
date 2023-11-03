import { drizzle } from "drizzle-orm/better-sqlite3";
import SQLite3 from "better-sqlite3";
import { join } from "path";
import { env } from "~/env.mjs";

const sqlite = new SQLite3(env.DATABASE_PATH);

// enable WAL mode
sqlite.pragma("journal_mode = WAL");

// load uuidv7 extension
// built from https://github.com/craigpastro/sqlite-uuidv7
sqlite.loadExtension(
  env.SQLITE_UUIDV7_EXT_PATH ?? join(__dirname, "../../exts/sqlite-uuidv7"),
);

export const db = drizzle(sqlite);
