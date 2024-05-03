import assert from "assert";
import { eq } from "drizzle-orm";
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
      // const fullServiceData = await ctx.db.query.service.findFirst({
      //   where: eq(serviceGeneration.id, ctx.service.getData().id),
      //   with: {
      //     domains: true,
      //     ports: true,
      //     volumes: true,
      //     sysctls: true,
      //     ulimits: true,
      //   },
      // });

      // assert(fullServiceData);

      // return {
      //   ...fullServiceData,
      //   deployMode: DOCKER_DEPLOY_MODE_MAP[fullServiceData.deployMode],
      // };

      return {
        ...ctx.service.getData(),
        latestGeneration: ctx.service.getData().latestGeneration,
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
      // const [defaultGeneration] = await ctx.db
      //   .insert(serviceGeneration)
      //   .values({
      //     : ctx.project.getData().id,

      //     status: "pending",
      //   })
      //   .returning({
      //     id: serviceGeneration.id,
      //   })
      //   .execute();

      const [data] = await ctx.db
        .insert(service)
        .values({
          name: input.name,
          projectId: ctx.project.getData().id,
          latestGenerationId: "",
          redeploySecret: randomBytes(env.REDEPLOY_SECRET_BYTES).toString(
            "hex",
          ),
          // source: ServiceSource.Docker,
          // dockerImage: "traefik/whoami",
        })
        .returning({
          id: serviceGeneration.id,
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
        .delete(serviceGeneration)
        .where(eq(serviceGeneration.id, input.serviceId))
        .execute();
    }),
});
