import pacakge from "../package.json";
const { version } = pacakge;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const logger = (await import("./server/utils/logger")).default;
    const { migrate } = await import("./server/db/migrate");

    logger.info(`🚀 Hostforge v${version} starting up`);
    await migrate();
  }
}
