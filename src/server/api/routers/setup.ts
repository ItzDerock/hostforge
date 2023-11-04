import { z } from "zod";
import { publicProcedure } from "../trpc";
import { sql } from "drizzle-orm";
import { users } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import assert from "assert";
import { Session } from "~/server/auth/Session";
import { hash } from "argon2";

export const setupProcedure = publicProcedure
  .input(
    z.object({
      username: z.string(),
      password: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // check if user already exists
    const [userCount] = await ctx.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .limit(1);

    // if user already exists, throw error
    if (userCount && userCount.count > 0)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Instance already set up",
      });

    // otherwise, create user
    const [user] = await ctx.db
      .insert(users)
      .values({
        username: input.username,
        password: await hash(input.password),
      })
      .returning({ id: users.id });

    // log the user in
    assert(user, "User should be created");
    const session = await Session.createForUser(user.id, ctx.request);
    ctx.request.cookies.set("session", session.data.token);

    return {
      success: true,
    };
  });
