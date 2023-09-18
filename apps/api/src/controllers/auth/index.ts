import { t } from "elysia";
import { sessionModel } from "../../database/models/session";
import { createController } from "..";
import { isSignedIn } from "./guard";
import { db } from "../../database";
import { userModel as dbUser } from "../../database/models/user";
import { eq } from "drizzle-orm";

export const authController = createController("/auth")
  .post(
    "/login",
    async (ctx) => {
      // grab the user from the db and check the hashed password
      const [user] = await db
        .select({ id: dbUser.id, password: dbUser.password })
        .from(dbUser)
        .where(eq(dbUser.username, ctx.body.username))
        .limit(1)
        .execute();

      if (!user) {
        // fake a slow response to prevent knowing if the user exists
        // not 100% sure if this is necessary, but it can't hurt
        await new Promise((resolve) => setTimeout(resolve, 50));

        ctx.set.status = 401;
        return { error: "Invalid username or password", success: false };
      }

      // validate password
      if (!Bun.password.verify(ctx.body.password, user.password)) {
        ctx.set.status = 401;
        return { error: "Invalid username or password", success: false };
      }

      // create a session
      const [sessionToken] = await db
        .insert(sessionModel)
        .values({
          userId: user.id,
          lastIp: ctx.ip,
        })
        .returning({ id: sessionModel.id })
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
  .get(
    "/protected",
    async (ctx) => {
      return { success: true };
    },
    {
      beforeHandle: [isSignedIn],
    }
  )
  .post("/setup-totp", async (ctx) => {}, {
    body: t.Object({
      password: t.String(),
    }),
  });
