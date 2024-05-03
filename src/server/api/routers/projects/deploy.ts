import { z } from "zod";
import { projectMiddleware } from "../../middleware/project";
import { authenticatedProcedure } from "../../trpc";

export const deployProject = authenticatedProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/api/projects/:projectId/deploy",
      summary: "Deploy project",
    },
  })
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .use(projectMiddleware)
  .mutation(async ({ ctx, input }) => {
    const response = await ctx.project.deploy({
      docker: ctx.docker,
    });

    // TODO: stream progress to client
    // https://github.com/trpc/trpc/issues/4477
    // could do with ws, but very complicated
    return {
      response,
    };
  });
