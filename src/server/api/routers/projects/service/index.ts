import assert from "assert";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { service } from "~/server/db/schema";
import {
  DOCKER_DEPLOY_MODE_MAP,
  DockerDeployMode,
  DockerRestartCondition,
  ServiceBuildMethod,
  ServiceSource,
} from "~/server/db/types";
import { zDockerName } from "~/server/utils/zod";
import { getServiceContainers } from "./containers";

export const serviceRouter = createTRPCRouter({
  containers: getServiceContainers,

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
      const fullServiceData = await ctx.db.query.service.findFirst({
        where: eq(service.id, ctx.service.id),
        with: {
          domains: true,
          ports: true,
          volumes: true,
          sysctls: true,
          ulimits: true,
        },
      });

      assert(fullServiceData);

      return {
        ...fullServiceData,
        zeroDowntime: fullServiceData.zeroDowntime === 1,
        deployMode: DOCKER_DEPLOY_MODE_MAP[fullServiceData.deployMode],
      };
    }),

  update: authenticatedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/api/projects/:projectId/services/:serviceId",
        summary: "Update service",
      },
    })
    .input(
      z
        .object({
          projectId: z.string(),
          serviceId: z.string(),
        })
        .merge(
          z
            .object({
              source: z.nativeEnum(ServiceSource),
              environment: z.string(),
              dockerImage: z.string(),
              dockerRegistryUsername: z.string(),
              dockerRegistryPassword: z.string(),
              // TODO: restrict to valid github url
              githubUrl: z.string().url(),
              githubBranch: z.string(),
              gitUrl: z.string(),
              gitBranch: z.string(),
              buildMethod: z.nativeEnum(ServiceBuildMethod),
              buildPath: z.string(),
              command: z.string(),
              entrypoint: z.string(),
              replicas: z.number(),
              maxReplicasPerNode: z.number(),
              deployMode: z.nativeEnum(DockerDeployMode),
              zeroDowntime: z.boolean(),
              max_cpu: z.number(),
              max_memory: z.string(),
              max_pids: z.number(),
              restart: z.nativeEnum(DockerRestartCondition),
            })
            .partial(),
        ),
    )
    .use(projectMiddleware)
    .use(serviceMiddleware)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(service)
        .set({
          name: input.name,
          zeroDowntime: input.zeroDowntime ? 1 : 0,
          deployMode: input.deployMode,
        })
        .where(eq(service.id, ctx.service.id))
        .execute();
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
