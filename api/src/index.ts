import { IncomingMessage, ServerResponse } from "http";
import { app, type ElysiaAPI as EAPI } from "./api";
export type ElysiaAPI = EAPI;
import { prepDatabase } from "./database/migrate";
import { env } from "./env";
import next from "web";
import { parse } from "url";
import path from "path";

// if this is the main module, start the server
if (import.meta.main) {
  import "compression-streams-polyfill";

  prepDatabase();

  // create and register next.js
  const nextApp = next({
    dev: env.dev,
    hostname: env.host,
    port: env.port,
    dir: path.dirname(import.meta.resolveSync("web")),
  });

  await nextApp.prepare();
  const handle = nextApp.getRequestHandler();

  app.onRequest(async (ctx) => {
    const incoming = new IncomingMessage(ctx.request);
    const response = new ServerResponse(incoming);
    await handle(
      incoming,
      response,
      parse(incoming.url ?? ctx.request.url ?? "", true)
    );
    return response;
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
