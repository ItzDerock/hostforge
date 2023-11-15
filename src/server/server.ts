import "dotenv/config";
import next from "next";
import { env } from "~/env";
import { createServer } from "http";
import logger from "./utils/logger";
import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter } from "./api/root";
import { createTRPCContext } from "./api/trpc";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db";
import { mkdir, stat } from "fs/promises";
import path from "path";
import { version } from "../../package.json";
import { stats } from "./modules/stats";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";

// check if database folder exists
try {
  const dir = path.dirname(env.DATABASE_PATH);
  await stat(dir);
} catch (e) {
  await mkdir(path.dirname(env.DATABASE_PATH), { recursive: true });
  logger.debug(`Created database folder ${path.dirname(env.DATABASE_PATH)}`);
}

// migrate the database
if (env.NODE_ENV === "production") {
  logger.child({ module: "database" }).info("⚙️ Migrating database");
  migrate(db, { migrationsFolder: "./migrations" });
  logger.child({ module: "database" }).info("✅ Database migrated");
} else {
  logger
    .child({ module: "database" })
    .info("Not running database migrations, use drizzle-kit push to migrate");
}

// start statistics
stats.start();

// initialize the next app
const app = next({
  dev: env.NODE_ENV !== "production",
  hostname: env.HOSTNAME,
  port: env.PORT,
  customServer: true,
});

await app.prepare();

// get the handles
const getHandler = app.getRequestHandler();
const upgradeHandler = app.getUpgradeHandler();

// create the http server
const server = createServer((req, res) => {
  // routes starting with /api/trpc are handled by trpc
  if (req.url?.startsWith("/api/trpc")) {
    const path = new URL(
      req.url.startsWith("/") ? `http://127.0.0.1${req.url}` : req.url,
    ).pathname.replace("/api/trpc/", "");

    return void nodeHTTPRequestHandler({
      path,
      req,
      res,
      router: appRouter,
      createContext: ({ req }) => {
        return createTRPCContext({
          req,
          res,
        });
      },
    });
  }

  getHandler(req, res).catch((error) => {
    logger.error(error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  });
});

// create the websocket server
const wss = new WebSocketServer({ noServer: true });
const trpcHandler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: ({ req }) => {
    return createTRPCContext({
      req,
    });
  },
});

process.on("SIGTERM", () => {
  logger.warn("SIGTERM received, shutting down...");
  trpcHandler.broadcastReconnectNotification();
  server.close(() => {
    process.exit(0);
  });
});

// handle the upgrade
server.on("upgrade", (req, socket, head) => {
  // send trpc requests to the trpc server
  if (req.url?.startsWith("/api/trpc")) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    void upgradeHandler(req, socket, head);
  }
});

// start the server
server.listen(env.PORT, env.HOSTNAME, () => {
  logger.info(`🚀 Hostforge`);
  logger.info(`│  Server listening on ${env.HOSTNAME}:${env.PORT}`);
  logger.info(`│  Version: ${version}`);
  logger.info(`│  Environment: ${env.NODE_ENV}`);
  logger.info(`╰  Build commit: ${env.NEXT_PUBLIC_BUILD_COMMIT_SHA}`);
});
