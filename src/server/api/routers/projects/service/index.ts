import assert from "assert";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { env } from "~/env";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { service } from "~/server/db/schema";
import {
  DOCKER_DEPLOY_MODE_MAP,
  DockerDeployMode,
  ServiceSource,
} from "~/server/db/types";
import { zDockerDuration, zDockerImage, zDockerName } from "~/server/utils/zod";
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
      // sometimes i forget how powerful zod is
      z
        .object({
          projectId: z.string(),
          serviceId: z.string(),
        })
        .merge(
          createInsertSchema(service, {
            dockerImage: zDockerImage,
            gitUrl: (schema) =>
              schema.gitUrl.regex(
                // https://www.debuggex.com/r/fFggA8Uc4YYKjl34 from https://stackoverflow.com/a/22312124
                // /(?P<host>(git@|https:\/\/)([\w\.@]+)(\/|:))(?P<owner>[\w,\-,\_]+)\/(?P<repo>[\w,\-,\_]+)(.git){0,1}((\/){0,1})/,
                /(git@|https:\/\/)([\w\.@]+)(\/|:)([\w,\-,\_]+)\/([\w,\-,\_]+)(.git){0,1}(\/{0,1})/,
                {
                  message: "Must be a valid git url. (Regex failed)",
                },
              ),
            deployMode: z
              .nativeEnum(DockerDeployMode)
              // or "replicated" | "global" and transform into 1 or 2
              .or(
                z
                  .enum(["replicated", "global"])
                  .transform((val) =>
                    val === "replicated"
                      ? DockerDeployMode.Replicated
                      : DockerDeployMode.Global,
                  ),
              ),
            zeroDowntime: z.boolean().transform((val) => (val ? 1 : 0)),
            restartDelay: zDockerDuration,
            healthcheckEnabled: z.boolean().transform((val) => (val ? 1 : 0)),
            healthcheckInterval: zDockerDuration,
            healthcheckTimeout: zDockerDuration,
            healthcheckStartPeriod: zDockerDuration,
            loggingMaxSize: (schema) =>
              schema.loggingMaxSize.regex(/^\d+[kmg]$/, {
                message: "Must be an integer plus a modifier (k, m, or g).",
              }),
            loggingMaxFiles: (schema) => schema.loggingMaxFiles.positive(),
          })
            .omit({
              id: true,
              projectId: true,
              name: true,
            })
            .partial(),
        )
        .strict(),
    )
    .use(projectMiddleware)
    .use(serviceMiddleware)
    .mutation(async ({ ctx, input }) => {
      // gotta keep TS happy, can't delete properties from input directly
      const queryUpdate: Omit<typeof input, "projectId" | "serviceId"> & {
        projectId?: string;
        serviceId?: string;
        id?: string;
      } = structuredClone(input);

      delete queryUpdate.projectId;
      delete queryUpdate.serviceId;
      delete queryUpdate.id;

      await ctx.db
        .update(service)
        .set(queryUpdate)
        .where(eq(service.id, ctx.service.id))
        .execute();

      return true;
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
