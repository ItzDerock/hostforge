import { z } from "zod";
import {
  authenticatedProcedure,
  createTRPCRouter,
  publicProcedure,
} from "../trpc";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { Session } from "~/server/auth/Session";

export const authRouter = createTRPCRouter({
  me: authenticatedProcedure.query(async ({ ctx }) => {
    const user = await ctx.session.getUser();

    return {
      id: user.id,
      username: user.username,
    };
  }),

  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select({ password: users.password, id: users.id, mfa: users.mfaToken })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user?.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The provided username/password is incorrect.",
        });
      }

      // argon2id
      const passwordMatches = await argon2.verify(
        user.password,
        input.password,
      );

      if (!passwordMatches) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The provided username/password is incorrect.",
        });
      }

      // check if mfa is enabled
      if (user.mfa) {
        // TODO: implement MFA
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "MFA is not yet implemented.",
        });
      }

      const session = await Session.createForUser(user.id, ctx.request);
      ctx.request.cookies.set("session", session.data.token);

      return {
        success: true,
      };
    }),
});
