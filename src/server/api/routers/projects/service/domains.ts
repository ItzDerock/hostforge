import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { serviceDomain } from "~/server/db/schema";
import { zDomain } from "~/server/utils/zod";

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
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .mutation(async ({ ctx, input }) => {
    const baseQuery = ctx.db
      .insert(serviceDomain)
      .values({
        id: input.domainId,
        serviceId: ctx.service.getData().latestGenerationId,
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
      .where(
        and(
          eq(serviceDomain.id, input.domainId),
          eq(serviceDomain.serviceId, ctx.service.getData().latestGenerationId),
        ),
      )
      .execute();

    return true;
  });
