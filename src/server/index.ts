import { IncomingMessage, ServerResponse } from "http";
import { app, type ElysiaAPI as EAPI } from "./api";
export type ElysiaAPI = EAPI;
import { prepDatabase } from "./database/migrate";
import { env } from "./env";
import next from "next";
// import { createServer } from "http";

// if this is the main module, start the server
if (import.meta.main) {
  prepDatabase();

  // create and register next.js
  const nextApp = next({
    dev: env.dev,
    hostname: env.host,
    port: env.port,
  });

  await nextApp.prepare();
  const handle = nextApp.getRequestHandler();
  const upgradeHandle = nextApp.getUpgradeHandler();

  /**
   * Handles a request from Bun and returns a response
   * @param req standard Bun request
   * @returns standard Bun response
   */
  const handleBun = (req: Request) => {
    return new Promise<Response>((resolve) => {
      const start = Date.now();

      // @ts-ignore
      const http_req = new IncomingMessage(req);
      const http_res = new ServerResponse({
        // @ts-ignore
        reply: (response) => {
          resolve(response);
          console.log("🛬 response took " + (Date.now() - start) + "ms");
        },

        req: http_req,
      });

      console.log("📦 Rendering page: " + req.url);
      handle(http_req, http_res);
    });
  };

  app.onRequest(async (ctx) => {
    return await handleBun(ctx.request).catch((err) => {
      console.log(err);
    });
  });

  app.listen(
    {
      port: env.port,
      hostname: env.host,
    },
    (data) => {
      console.log(`🚀 listening on ${data.hostname}:${data.port}`);
    }
  );
}
