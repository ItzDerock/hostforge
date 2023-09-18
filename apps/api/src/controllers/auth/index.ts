import { Elysia, t } from "elysia";
import type { BaseElysiaContext } from "../..";
import { db } from "../../database";

export const authController = new Elysia<"/auth", BaseElysiaContext>({
  prefix: "/auth",
})
  .post(
    "/login",
    async (ctx) => {
      // grab the user from the db and check the hashed password
      const user = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, ctx.body.username),
      });

      if (!user) {
        ctx.set.status = 401;
        return { error: "Invalid username or password" };
      }

      // check the password
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/cookie", (...args) => {
    console.log(args);
    return "cookie";
  });
