import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { service, serviceDomain } from "~/server/db/schema";
import { DockerDeployMode } from "~/server/db/types";
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
  });

export const updateServiceDomainsProcedure = authenticatedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: "/api/projects/:projectId/services/:serviceId/domains/:domainId",
      summary: "Update or create a service domains",
    },
  })
  .input(
    z.object({
      // meta
      projectId: z.string(),
      serviceId: z.string(),
      domainId: z
        .string()
        .regex(
          /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        )
        .optional(),

      // details
      domain: zDomain,
      internalPort: z.coerce.number().int().min(1).max(65535),
      https: z.boolean(),
      forceSSL: z.boolean().default(true),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const baseQuery = ctx.db
      .insert(serviceDomain)
      .values({
        id: input.domainId,
        serviceId: input.serviceId,
        domain: input.domain,
        internalPort: input.internalPort,
        https: input.https,
        forceSSL: input.forceSSL,
      })
      .returning({
        id: serviceDomain.id,
      });

    // track if we inserted or updated
    let updated = false;
    let domainId = input.domainId;

    if (input.domainId) {
      const result = await baseQuery
        .onConflictDoUpdate({
          set: {
            internalPort: input.internalPort,
            https: input.https,
            forceSSL: input.forceSSL,
            domain: input.domain,
          },
          target: serviceDomain.id,
        })
        .execute();

      if (result[0]) {
        updated = true;
        domainId = result[0].id;
      }
    } else {
      const result = await baseQuery.execute();

      if (result[0]) {
        updated = false;
        domainId = result[0].id;
      }
    }

    return {
      updated,
      domainId,
    };
  });

/**
 * Deletes a service domain
 */
export const deleteServiceDomainsProcedure = authenticatedProcedure
  .meta({
    openapi: {
      method: "DELETE",
      path: "/api/projects/:projectId/services/:serviceId/domains/:domainId",
      summary: "Delete a service domain",
    },
  })
  .input(
    z.object({
      projectId: z.string(),
      serviceId: z.string(),
      domainId: z.string(),
    }),
  )
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .mutation(async ({ ctx, input }) => {
    await ctx.db
      .delete(serviceDomain)
      .where(eq(serviceDomain.id, input.domainId))
      .execute();

    return true;
  });
