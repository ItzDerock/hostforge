import cookie from "@elysiajs/cookie";
import swagger from "@elysiajs/swagger";
import Elysia from "elysia";
import { sessionMiddleware } from "./controllers/auth/session";
import { database } from "./database";

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

export default baseApp;
