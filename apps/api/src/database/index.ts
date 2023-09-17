import { drizzle, BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import path from "path";
import { env } from "../env";
import fs from "fs/promises";

// build database path
const dbPath = path.join(process.cwd(), env.dbPath);
const dbFolder = path.dirname(dbPath);

// ensure the database folder exists
try {
  if (!(await fs.exists(dbFolder))) {
    await fs.mkdir(dbFolder, { recursive: true });
  }
} catch (e) {
  console.error(`failed to create database path:`, e);
  process.exit(1);
}

const sqlite = new Database(path.join(process.cwd(), env.dbPath));

// enter WAL mode
sqlite.run("pragma journal_mode = WAL");

export const db: BunSQLiteDatabase = drizzle(sqlite);
