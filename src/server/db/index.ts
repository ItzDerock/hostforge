import SQLite3 from "better-sqlite3";
import chalk from "chalk";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { join } from "path";
import { env } from "~/env";
import logger from "../utils/logger";
import * as schema from "./schema";

const globalForDB = globalThis as unknown as {
  db: ReturnType<typeof createDatabaseInstance>;
};

function createDatabaseInstance() {
  const LOGGER = logger.child({ module: "database" });

  // Create database folder if does not exist
  const databaseFolder = path.resolve(path.dirname(env.DATABASE_PATH));

  if (!fs.existsSync(databaseFolder)) {
    LOGGER.debug(
      `Folder "${chalk.yellow(databaseFolder)}" does not exist, creating...`,
    );

    try {
      fs.mkdirSync(databaseFolder, {
        recursive: true,
        mode: 0o700,
      });
    } catch (error) {
      LOGGER.error(
        `Failed to create database directory. Either create it manually or check the permissions of the parent folder.`,
        error,
      );

      process.exit(1);
    }

    LOGGER.info(
      `Created previously non-existent database folder ${chalk.yellow(
        databaseFolder,
      )}`,
    );
  }

  const sqlite = new SQLite3(env.DATABASE_PATH);

  // enable WAL mode
  sqlite.pragma("journal_mode = WAL");

  // load uuidv7 extension
  // built from https://github.com/craigpastro/sqlite-uuidv7
  if (env.SQLITE_UUIDV7_EXT_PATH) {
    LOGGER.warn(
      `Be careful when loading custom UUIDv7 extensions, currently Hostforge is set to load from: "${chalk.yellow(
        path.resolve(env.SQLITE_UUIDV7_EXT_PATH),
      )}"! Non-official extensions may contain backdoors or introduce new vulnerabilities.`,
    );
  }

  sqlite.loadExtension(
    env.SQLITE_UUIDV7_EXT_PATH ??
      join(
        // cannot use __dirname since this file will change locations when compiled
        process.cwd(),
        "./exts/sqlite-uuidv7",
      ),
  );

  const orm = drizzle(sqlite, {
    schema,
    logger: {
      logQuery(query) {
        LOGGER.debug(query);
      },
    },
  });

  // @ts-ignore
  orm.sqlite = sqlite;
  return orm;
}

export const db = (globalForDB.db ??= createDatabaseInstance());
