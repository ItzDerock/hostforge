import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import "dotenv/config";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdir, stat } from "fs/promises";
import { createServer } from "http";
import next from "next";
import path from "path";
import { WebSocketServer } from "ws";
import { env } from "~/env";
import { version } from "../../package.json";
import { appRouter } from "./api/root";
import { createTRPCContext } from "./api/trpc";
import { db } from "./db";
import logger from "./utils/logger";
import SettingsManager from "./managers/SettingsManager";
import { GlobalStore } from "./managers/GlobalContext";
import { getDockerInstance } from "./docker";

// check if database folder exists
try {
  const dir = path.dirname(env.DATABASE_PATH);
  await stat(dir);
} catch (e) {
  await mkdir(path.dirname(env.DATABASE_PATH), { recursive: true });
  logger.debug(`Created database folder ${path.dirname(env.DATABASE_PATH)}`);
}

// migrate the database
if (process.env.NODE_ENV === "production") {
  logger
    .child({ module: "database" })
    .info("⚙️ Starting database migrations...");

  migrate(db, { migrationsFolder: "./drizzle" });
  logger.child({ module: "database" }).info("✅ Migrations finished!");
} else {
  logger
    .child({ module: "database" })
    .info("Not running migrations in development.");
}

// load settings
const settingsStore = await SettingsManager.createInstance(db);
const globalContext = new GlobalStore(
  db,
  settingsStore,
  await getDockerInstance(),
);

// start statistics
// void stats.start();
await settingsStore.waitForSetup().then(async () => {
  await globalContext.internalServices.networks.waitForNetworks();
  await new Promise((r) => setTimeout(r, 500)); // takes a bit for the networks to be ready
  void globalContext.internalServices.netdata.serviceManager.init();
  void globalContext.internalServices.traefik.init();
});

// initialize the next app
const app = next({
  dev: env.NODE_ENV !== "production",
  hostname: env.HOSTNAME,
  port: env.PORT,
  customServer: true,
});

await app.prepare();

// create openapi documentation if in development
// const openAPIDocument =
//   env.NODE_ENV === "development"
//     ? JSON.stringify(
//         generateOpenApiDocument(appRouter, {
//           title: "Hostforge API Documentation",
//           version,
//           baseUrl: `http://${env.HOSTNAME}:${env.PORT}`,
//         }),
//       )
//     : null;

// get the handles
const getHandler = app.getRequestHandler();
const upgradeHandler = app.getUpgradeHandler();
// const openAPIHandle = createOpenApiHttpHandler({
//   router: appRouter,
//   createContext: createTRPCContext,
// });

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
          globalContext,
        });
      },
    });
  }

  // handle openAPI routes
  // if (req.url?.startsWith("/api/")) {
  //   return void openAPIHandle(req, res);
  // }

  // serve openapi documentation
  // if (req.url?.startsWith("/openapi.json") && openAPIDocument) {
  //   res.setHeader("Content-Type", "application/json");
  //   res.end(openAPIDocument);
  //   return;
  // }

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
      globalContext,
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
logger.debug(`Attempting to listen on ${env.HOSTNAME}:${env.PORT}`);
server.listen(env.PORT, env.HOSTNAME, () => {
  logger.info(`🚀 Hostforge`);
  logger.info(`│  Server listening on ${env.HOSTNAME}:${env.PORT}`);
  logger.info(`│  Version: ${version}`);
  logger.info(`│  Environment: ${env.NODE_ENV}`);
  logger.info(`╰  Build commit: ${env.NEXT_PUBLIC_BUILD_COMMIT_SHA}`);
});
