import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { serviceDomain, serviceGeneration } from "~/server/db/schema";
import { DockerDeployMode, DockerRestartCondition } from "~/server/db/types";
import { zDockerDuration, zDockerImage, zDomain } from "~/server/utils/zod";

/**
 * Handles updating basic details of a service
 */
export const updateServiceProcedure = authenticatedProcedure
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
        createInsertSchema(serviceGeneration, {
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
          restart: z
            .nativeEnum(DockerRestartCondition)
            .or(
              z
                .enum(["any", "never", "on-failure"])
                .transform((val) =>
                  val === "any"
                    ? DockerRestartCondition.Always
                    : val === "on-failure"
                      ? DockerRestartCondition.OnFailure
                      : DockerRestartCondition.Never,
                ),
            ),

          zeroDowntime: z.boolean(),
          restartDelay: zDockerDuration,
          healthcheckEnabled: z.boolean(),
          healthcheckInterval: zDockerDuration,
          healthcheckTimeout: zDockerDuration,
          healthcheckStartPeriod: zDockerDuration,
          loggingMaxSize: (schema) =>
            schema.loggingMaxSize.regex(/^\d+[kmg]$/, {
              message: "Must be an integer plus a modifier (k, m, or g).",
            }),
          loggingMaxFiles: (schema) => schema.loggingMaxFiles.positive(),

          // float as string
          max_cpu: z.coerce.number().default(0),
          max_memory: z
            .string()
            .regex(/^\d+(\.\d+)?[kmgKMG]?$/)
            .default("0"),
        })
          .omit({
            id: true,
            projectId: true,
            name: true,
            serviceId: true,
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
      .update(serviceGeneration)
      .set(queryUpdate)
      .where(eq(serviceGeneration.id, ctx.service.getData().latestGenerationId))
      .execute();

    return true;
  });
