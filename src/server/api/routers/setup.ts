import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { users } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import assert from "assert";
import { hash } from "argon2";
import { randomBytes } from "crypto";
import { DockerNetworks } from "~/server/docker";
import logger from "~/server/utils/logger";
import { env } from "~/env";

export const setupRouter = createTRPCRouter({
  setup: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        letsencryptEmail: z.string().nullable(),
        domain: z
          .string()
          .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)*$/)
          .nullable(),
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
        registrySecret: randomBytes(32).toString("hex"),
        domain: input.domain,
      });

      // try to set the domain
      let successfullyUpdated = false;
      try {
        await ctx.docker.cli([
          "service",
          "update",
          "hostforge",
          "--label-add",
          "traefik.constraint-label=hostforge-public",
          "--label-add",
          "traefik.enable=true",
          "--label-add",
          `traefik.http.routers.hostforge.rule=Host(\`${input.domain}\`)`,
          "--label-add",
          "traefik.http.routers.hostforge.entrypoints=websecure",
          "--label-add",
          "traefik.http.routers.hostforge.tls=true",
          "--label-add",
          "traefik.http.routers.hostforge.tls.certresolver=letsencrypt",
          "--label-add",
          "traefik.http.services.api.loadbalancer.server.port=3000",
          "--label-add",
          `traefik.docker.network=${DockerNetworks.Public}`,
          // redirect http to https
          "--label-add",
          "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https",
          "--label-add",
          "traefik.http.routers.hostforge.middlewares=redirect-to-https",
        ]);

        successfullyUpdated = true;
      } catch (err) {
        if (env.NODE_ENV !== "production") {
          logger.warn(
            "Failed to update self labels for traefik. This can be ignored in development",
          );
        } else {
          logger.warn(
            `
            Failed to update self labels for traefik.`,
            err,
          );
        }
      }

      // log the user in
      assert(user, "User should be created");

      const session = await ctx.globalStore.sessions.createForUser(
        user.id,
        ctx.request,
      );
      ctx.response?.setHeader("Set-Cookie", session.getCookieString());

      return {
        success: true,
        domain: input.domain,
        updatedTraefik: successfullyUpdated,
      };
    }),

  status: publicProcedure.query(({ ctx }) => {
    return {
      setup: ctx.globalStore.settings.isInstanceSetup(),
    };
  }),
});
