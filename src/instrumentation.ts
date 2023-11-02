import pacakge from "../package.json";
const { version } = pacakge;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const logger = (await import("./server/utils/logger")).default;
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    const { db } = await import("./server/db");

    logger.child({ module: "database" }).info("⚙️ Migrating database");
    migrate(db, { migrationsFolder: "./migrations" });
    logger.child({ module: "database" }).info("✅ Database migrated");

    logger.info(`🚀 Hostforge v${version} ready!`);
  }
}
