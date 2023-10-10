import { Migrate } from "@prisma/migrate/dist/Migrate";
import rootLogger from "../utils/logger";
import { ensureDatabaseExists } from "@prisma/migrate/dist/utils/ensureDatabaseExists";

/**
 * Runs database migrations. Code stolen from diced/zipline:
 * https://github.com/diced/zipline/blob/d112c3a509fcc4c3f36906dca5ad02a74a4f423e/src/server/util.ts#L9
 */
export async function migrate() {
  const logger = rootLogger.child({ module: "db::migrate" });

  logger.info("Running database migrations");

  try {
    logger.debug("establishing database connection");
    const migrate = new Migrate("./prisma/schema.prisma");

    logger.debug(
      "ensuring database exists, if not creating database - may error if no permissions",
    );
    await ensureDatabaseExists("apply", "./prisma/schema.prisma");

    const diagnose = await migrate.diagnoseMigrationHistory({
      optInToShadowDatabase: false,
    });

    if (diagnose.history?.diagnostic === "databaseIsBehind") {
      if (!diagnose.hasMigrationsTable) {
        logger.debug("no migrations table found, attempting schema push");
        try {
          logger.debug("pushing schema");
          const migration = await migrate.push({ force: false });
          if (migration.unexecutable && migration.unexecutable.length > 0)
            throw new Error(
              "This database is not empty, schema push is not possible.",
            );
        } catch (e) {
          migrate.stop();
          logger.error("failed to push schema");
          throw e;
        }
        logger.debug("finished pushing schema, marking migrations as applied");
        for (const migration of diagnose.history.unappliedMigrationNames) {
          await migrate.markMigrationApplied({ migrationId: migration });
        }
        migrate.stop();
        logger.info("finished migrating database");
      } else if (diagnose.hasMigrationsTable) {
        logger.debug("database is behind, attempting to migrate");
        try {
          logger.debug("migrating database");
          await migrate.applyMigrations();
        } catch (e) {
          logger.error("failed to migrate database");
          migrate.stop();
          throw e;
        }
        migrate.stop();
        logger.info("finished migrating database");
      }
    } else {
      logger.info("exiting migrations engine - database is up to date");
      migrate.stop();
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("P1001")) {
      logger.error(
        `Unable to connect to database \`${process.env.DATABASE_URL}\`, check your database connection`,
      );
      logger.debug(error);
    } else {
      logger.error("Failed to migrate database... exiting...");
      logger.error(error);
    }

    process.nextTick(() => process.exit(1));
  }
}
