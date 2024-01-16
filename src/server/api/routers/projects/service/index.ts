import assert from "assert";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import { projectMiddleware } from "~/server/api/middleware/project";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { service } from "~/server/db/schema";
import { ServiceSource } from "~/server/db/types";
import { zDockerName } from "~/server/utils/zod";
import { getServiceContainers } from "./containers";

export const serviceRouter = createTRPCRouter({
  containers: getServiceContainers,

  create: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/api/projects/:projectId/services",
        summary: "Create service",
      },
    })
    .input(
      z.object({
        projectId: z.string(),
        name: zDockerName,
      }),
    )
    .output(z.string({ description: "Service ID" }))
    .use(projectMiddleware)
    .mutation(async ({ ctx, input }) => {
      const [data] = await ctx.db
        .insert(service)
        .values({
          name: input.name,
          projectId: ctx.project.id,
          redeploySecret: randomBytes(env.REDEPLOY_SECRET_BYTES).toString(
            "hex",
          ),
          source: ServiceSource.Docker,

          dockerImage: "traefik/whoami",
        })
        .returning({
          id: service.id,
        })
        .execute()
        .catch((err) => {
          console.error(err);
          throw err;
        });

      assert(data?.id);

      return data.id;
    }),

  delete: authenticatedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/api/projects/:projectId/services/:serviceId",
        summary: "Delete service",
      },
    })
    .input(z.object({ projectId: z.string(), serviceId: z.string() }))
    .use(projectMiddleware)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(service)
        .where(eq(service.id, input.serviceId))
        .execute();
    }),
});
