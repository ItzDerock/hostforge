import { t } from "elysia";
import { createController } from ".";
import { db } from "../database";
import { userModel } from "../database/models/user";
import { sessionModel } from "../database/models/session";
import { sql } from "drizzle-orm";

export const setupController = createController("/setup")
  .post(
    "/",
    async (ctx) => {
      // if a user exists, we're already setup
      if (
        (
          await db
            .select({ count: sql<number>`count(*)` })
            .from(userModel)
            .limit(1)
            .execute()
        )[0].count > 0
      ) {
        ctx.set.status = 400;
        return { error: "Setup already completed.", success: false };
      }
      console.log("a");
      // create the administrator user
      const [adminUser] = await db
        .insert(userModel)
        .values({
          username: ctx.body.username,
          password: await Bun.password.hash(ctx.body.password),
          permissions: BigInt(1),
        })
        .returning({ id: userModel.id })
        .execute();

      // and set the session
      const [sessionToken] = await db
        .insert(sessionModel)
        .values({
          userId: adminUser.id,
          lastIp: ctx.ip,
        })
        .returning()
        .execute();

      // set the cookie
      ctx.setCookie("session", sessionToken.id, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });

      return { success: true };
    },

    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/status", async () => {
    return {
      setupCompleted:
        (
          await db
            .select({ count: sql<number>`count(*)` })
            .from(userModel)
            .limit(1)
            .execute()
        )[0].count > 0,
    };
  });
