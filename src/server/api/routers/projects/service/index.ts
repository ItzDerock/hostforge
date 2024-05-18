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
import { ServiceSource } from "~/server/db/types";
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "uuidv7";
import logger from "~/server/utils/logger";
import { type Database } from "better-sqlite3";
import { getDeploymentsProcedure } from "./deployments";
import { getDeploymentLogsSubscription } from "./logs";

export const serviceRouter = createTRPCRouter({
  containers: getServiceContainers,
  update: updateServiceProcedure,
  updateDomain: updateServiceDomainsProcedure,
  deleteDomain: deleteServiceDomainsProcedure,
  deployments: getDeploymentsProcedure,
  deploymentLogs: getDeploymentLogsSubscription,

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
      const log = logger.child({ module: "service.create" });

      // create a generation for the service
      // eslint-disable-next-line @typescript-eslint/require-await
      const trxResult = await ctx.db.transaction(async (trx) => {
        // @ts-expect-error using drizzle-orm doesnt work, keep getting foreign key constraint error after the first insert despite it being deferred
        const db: Database = trx.session.client; // eslint-disable-line

        db.pragma(`defer_foreign_keys = ON`);

        const generationId = uuidv7();
        const serviceId = uuidv7();

        // create initial generation
        const dialect = new SQLiteSyncDialect();
        const createGenerationQuery = dialect.sqlToQuery(
          trx
            .insert(serviceGeneration)
            .values({
              id: generationId,
              serviceId: serviceId,
              source: ServiceSource.Docker,
              dockerImage: "traefik/whoami",
            })
            .getSQL(),
        );

        const genCreateResult = db
          .prepare(createGenerationQuery.sql)
          .run(...createGenerationQuery.params);

        log.debug(
          "inserted generation",
          createGenerationQuery.sql,
          genCreateResult,
        );

        // create the service
        const createServiceQuery = dialect.sqlToQuery(
          trx
            .insert(service)
            .values({
              id: serviceId,
              name: input.name,
              projectId: ctx.project.getData().id,
              latestGenerationId: generationId,
              redeploySecret: randomBytes(env.REDEPLOY_SECRET_BYTES).toString(
                "hex",
              ),
            })
            .returning({
              id: serviceGeneration.id,
            })
            .getSQL(),
        );

        const createResult = db
          .prepare(createServiceQuery.sql)
          .run(...createServiceQuery.params);

        log.debug("inserted service", createServiceQuery.sql, createResult);

        return serviceId;
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
