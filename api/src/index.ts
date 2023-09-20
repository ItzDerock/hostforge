import { IncomingMessage, ServerResponse, createServer } from "http";
import { app, type ElysiaAPI as EAPI } from "./api";
export type ElysiaAPI = EAPI;
import { prepDatabase } from "./database/migrate";
import { env } from "./env";
import next from "web";
import path from "path";

// if this is the main module, start the server
if (import.meta.main) {
  prepDatabase();

  // create and register next.js
  const nextApp = next({
    dev: env.dev,
    hostname: "10.0.0.50",
    port: env.port,
    dir: path.dirname(import.meta.resolveSync("web")),
  });

  await nextApp.prepare();
  const handle = nextApp.getRequestHandler();

  const handleBun = (req: Request) => {
    return new Promise<Response>((resolve) => {
      const start = Date.now();

      const http_req = new IncomingMessage(req);
      const http_res = new ServerResponse({
        reply: (response) => {
          console.log("Reply got");
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
    const res = await handleBun(ctx.request).catch((err) => {
      console.log(err);
    });
    console.log("yay response!!");
    return res;
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
