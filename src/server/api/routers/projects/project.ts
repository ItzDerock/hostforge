import { z } from "zod";
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
    const projServices = await ctx.project.getServices();

    // get docker stats
    const stats = await ctx.docker.listServices({
      filters: {
        label: [
          `com.docker.stack.namespace=${ctx.project.getData().internalName}`,
        ],
      },
    });

    return {
      ...ctx.project.getData(),
      isDeploying: await ctx.project.isDeploying(),
      services: projServices.map((service) => ({
        ...service.getData(),
        stats: stats.find((stat) => stat.Spec?.Name === service.getData().name),
      })),
    };
  });
