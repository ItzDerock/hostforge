import "dotenv/config";

import next from "next";
import { env } from "~/env.mjs";
import { createServer } from "http";
import logger from "./utils/logger";
import ws from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter } from "./api/root";
import { createTRPCContext } from "./api/trpc";
import { incomingRequestToNextRequest } from "./utils/serverUtils";

async function startApp() {
  // initialize the next app
  const app = next({
    dev: env.NODE_ENV !== "production",
    hostname: env.HOSTNAME,
    port: env.PORT,
  });

  await app.prepare();

  // get the handles
  const getHandler = app.getRequestHandler();
  const upgradeHandler = app.getUpgradeHandler();

  // create the http server
  const server = createServer((req, res) => {
    try {
      // handle the request
      getHandler(req, res);
    } catch (error) {
      logger.error(error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // create the websocket server
  const wss = new ws.Server({ noServer: true });
  const trpcHandler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: ({ req }) =>
      createTRPCContext({
        req: incomingRequestToNextRequest(req),
        resHeaders: new Headers(),
      }),
  });

  process.on("SIGTERM", () => {
    trpcHandler.broadcastReconnectNotification();
    server.close(() => {
      process.exit(0);
    });
  });

  // handle the upgrade
  server.on("upgrade", (req, socket, head) => {
    // send trpc requests to the trpc server
    if (req.url?.startsWith("/api/trpc")) {
      wss.handleUpgrade(req, socket, head, () => {});
    } else {
      upgradeHandler(req, socket, head);
    }
  });

  // start the server
  server.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

startApp();
