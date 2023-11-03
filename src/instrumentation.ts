import pacakge from "../package.json";
import { env } from "./env.mjs";
const { version } = pacakge;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const logger = (await import("./server/utils/logger")).default;
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    const { db } = await import("./server/db");

    if (env.NODE_ENV === "production") {
      logger.child({ module: "database" }).info("⚙️ Migrating database");
      migrate(db, { migrationsFolder: "./migrations" });
      logger.child({ module: "database" }).info("✅ Database migrated");
    } else {
      logger
        .child({ module: "database" })
        .info(
          "Not running database migrations, use drizzle-kit push to migrate",
        );
    }

    logger.info(`🚀 Hostforge v${version} ready!`);
  }
}
