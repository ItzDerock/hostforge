import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { authController } from "./controllers/auth";
import { env } from "./env";
import { prepDatabase } from "./database/migrate";

// start by prepping the database
prepDatabase();

// base elysia app with all the plugins
const baseApp = new Elysia().use(cookie());
type ExtractContext<T> = T extends Elysia<infer _U, infer V> ? V : never;
export type BaseElysiaContext = ExtractContext<typeof baseApp>;

// add in our routes
const withRoutes = baseApp.use(authController);
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
