import cookie from "@elysiajs/cookie";
import Elysia from "elysia";
import type { ExtractContext } from "../..";
import { db } from "../../database";
import { userModel } from "../../database/models/user";
import { sessionModel } from "../../database/models/session";
import { eq } from "drizzle-orm";
import ipaddrjs from "ipaddr.js";

type CookieReturn = ReturnType<typeof cookie>;
type CookieContext = ExtractContext<CookieReturn>;

export const sessionMiddleware = new Elysia<"", CookieContext>()
  .derive((ctx) => {
    // TODO: cloudflare

    // apparently you can't get the remote ip in bun...
    // https://github.com/oven-sh/bun/issues/3540
    let ip = "127.0.0.1";

    // check the x-forwarded-for header since this app is behind a proxy
    const realIPHeader = ctx.request.headers.get("x-forwarded-for");

    // we need to select the left-most IP that is valid and non-private
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
    if (realIPHeader) {
      for (let ip of realIPHeader.split(",")) {
        // trim whitespace
        ip = ip.trim();

        // and check validity
        if (ipaddrjs.isValid(ip) && ipaddrjs.process(ip).range() != "private") {
          ip = ipaddrjs.process(ip).toString();
          break;
        }
      }
    }

    return {
      ip,
    };
  })
  .derive(async (ctx) => {
    // lookup session for the user
    if (!ctx.cookie.session) {
      return {
        user: null,
      };
    }

    // find session and user
    const [user] = await db
      .select({
        id: userModel.id,
        username: userModel.username,
        permissions: userModel.permissions,

        // get the last ip from the session
        lastIp: sessionModel.lastIp,
      })
      .from(sessionModel)
      .where(eq(sessionModel.id, ctx.cookie.session))
      .innerJoin(userModel, eq(userModel.id, sessionModel.userId))
      .limit(1)
      .execute();

    // if the IP is different, we should update the session details
    if (user.lastIp !== ctx.ip) {
      // update the database asynchronously
      (async () =>
        db
          .update(sessionModel)
          .set({
            lastIp: ctx.ip,
          })
          .where(eq(sessionModel.id, ctx.cookie.session))
          .execute())();
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions,
      },
    };
  });
