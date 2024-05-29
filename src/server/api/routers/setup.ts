import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { users } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import assert from "assert";
import { hash } from "argon2";

export const setupRouter = createTRPCRouter({
  setup: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        letsencryptEmail: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // if user already exists, throw error
      if (ctx.globalStore.settings.isInstanceSetup())
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

      await ctx.globalStore.settings.setupInstance({
        letsencryptEmail: input.letsencryptEmail,
      });

      // log the user in
      assert(user, "User should be created");

      const session = await ctx.globalStore.sessions.createForUser(
        user.id,
        ctx.request,
      );
      ctx.response?.setHeader("Set-Cookie", session.getCookieString());

      return {
        success: true,
      };
    }),

  status: publicProcedure.query(({ ctx }) => {
    return {
      setup: ctx.globalStore.settings.isInstanceSetup(),
    };
  }),
});
