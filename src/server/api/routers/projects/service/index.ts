import assert from "assert";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { env } from "~/env";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { service, serviceGeneration } from "~/server/db/schema";
import { zDockerName } from "~/server/utils/zod";
import { getServiceContainers } from "./containers";
import {
  deleteServiceDomainsProcedure,
  updateServiceDomainsProcedure,
  updateServiceProcedure,
} from "./update";
import { ServiceSource } from "~/server/db/types";
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";

export const serviceRouter = createTRPCRouter({
  containers: getServiceContainers,
  update: updateServiceProcedure,
  updateDomain: updateServiceDomainsProcedure,
  deleteDomain: deleteServiceDomainsProcedure,

  get: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/api/projects/:projectId/services/:serviceId",
        summary: "Get service",
      },
    })
    .input(z.object({ projectId: z.string(), serviceId: z.string() }))
    .use(projectMiddleware)
    .use(serviceMiddleware)
    .query(async ({ ctx }) => {
      return {
        ...ctx.service.getData(),
        latestGeneration: await ctx.service.fetchFullLatestGeneration(),
      };
    }),

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
      // create a generation for the service
      const trxResult = await ctx.db.transaction(async (trx) => {
        // create initial generation
        const [generation] = await trx
          .insert(serviceGeneration)
          .values({
            serviceId: "",
            source: ServiceSource.Docker,
            dockerImage: "traefik/whoami",
          })
          .returning({
            id: serviceGeneration.id,
          });

        assert(generation?.id, "Expected generation data to be returned");

        // create the service
        const [data] = await trx
          .insert(service)
          .values({
            name: input.name,
            projectId: ctx.project.getData().id,
            latestGenerationId: generation.id,
            redeploySecret: randomBytes(env.REDEPLOY_SECRET_BYTES).toString(
              "hex",
            ),
          })
          .returning({
            id: serviceGeneration.id,
          });

        assert(data?.id, "Expected service data to be returned");

        // update the service with the generation id
        await trx
          .update(serviceGeneration)
          .set({
            serviceId: data.id,
          })
          .where(eq(service.id, data.id))
          .execute();

        return data.id;
      });

      return trxResult;
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
        .delete(serviceGeneration)
        .where(eq(serviceGeneration.id, input.serviceId))
        .execute();
    }),
});
