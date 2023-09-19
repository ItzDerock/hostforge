import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { authController } from "./controllers/auth";
import { env } from "./env";
import { prepDatabase } from "./database/migrate";
import { database } from "./database";
import { sessionMiddleware } from "./controllers/auth/session";
import { setupController } from "./controllers/setup";
import swagger from "@elysiajs/swagger";

// start by prepping the database
prepDatabase();

// base elysia app with all the plugins
const baseApp = new Elysia()
  .use(cookie())
  .use(database)
  .use(sessionMiddleware)
  .use(swagger())
  .onError(({ code, error, ...ctx }) => {
    console.error(`error ${code} in ${ctx.request}: `, error);
    return new Response(error.toString());
  });

export type ExtractContext<T> = T extends Elysia<infer _U, infer V> ? V : never;
export type BaseElysia = typeof baseApp;
export type BaseElysiaContext = ExtractContext<BaseElysia>;

// add in our routes
const withRoutes = baseApp.use(authController).use(setupController);
export type ElysiaWithRoutes = typeof withRoutes;

// if this is the main module, start the server
if (import.meta.main) {
  withRoutes.listen(
    {
      port: env.port,
      hostname: env.host,
    },
    (data) => {
      console.log(`🚀 listening on ${data.hostname}:${data.port}`);
    }
  );
}
