import { eq } from "drizzle-orm";
import { z } from "zod";
import { service } from "~/server/db/schema";
import { projectMiddleware } from "../../middleware/project";
import { authenticatedProcedure } from "../../trpc";

export const getProject = authenticatedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/api/projects/:projectId",
      summary: "Get project",
    },
  })
  .input(z.object({ projectId: z.string() }))
  .use(projectMiddleware)
  .output(z.unknown())
  .query(async ({ ctx }) => {
    const projServices = await ctx.db
      .select({
        id: service.id,
        name: service.name,
      })
      .from(service)
      .where(eq(service.projectId, ctx.project.id));

    // get docker stats
    const stats = await ctx.docker.listServices({
      filters: {
        label: [`com.docker.stack.namespace=${ctx.project.internalName}`],
      },
    });

    return {
      ...ctx.project,
      services: projServices.map((service) => ({
        ...service,
        stats: stats.find((stat) => stat.Spec?.Name === service.name),
      })),
    };
  });
