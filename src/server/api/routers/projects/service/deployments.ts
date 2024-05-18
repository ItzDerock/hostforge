import { eq } from "drizzle-orm";
import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";

export const getDeploymentsProcedure = authenticatedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/api/deployments",
      summary: "Get deployments",
    },
  })
  .input(
    z.object({
      projectId: z.string(),
      serviceId: z.string(),
    }),
  )
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .query(async ({ ctx }) => {
    return ctx.db.query.serviceDeployment.findMany({
      where: (tbl, { eq }) => eq(tbl.serviceId, ctx.service.getData().id),
      columns: {
        deployedAt: true,
        deployedBy: true,
        buildLogs: false,
        id: true,
        projectDeploymentId: true,
        status: true,
      },
    });
  });
