import { z } from "zod";
import { projectMiddleware } from "../../middleware/project";
import { authenticatedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

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
  .mutation(async ({ ctx }) => {
    if (await ctx.project.isDeploying()) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "There is already a pending deployment.",
      });
    }

    await ctx.project.deploy(
      {
        docker: ctx.docker,
      },
      ctx.globalStore,
    );

    // TODO: stream progress to client
    // https://github.com/trpc/trpc/issues/4477
    // could do with ws, but very complicated
    return { success: true };
  });

export const getDeployDiff = authenticatedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/api/projects/:projectId/deploy/diff",
      summary:
        "Get changes from deployed generation and current undeployed generation.",
    },
  })
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .use(projectMiddleware)
  .query(async ({ ctx }) => {
    const services = await ctx.project.getServicesWithPendingUpdates();
    return await Promise.all(
      services.map(async (service) => ({
        service: {
          name: service.getData().name,
          id: service.getData().id,
        },
        diff: await service.buildDeployDiff(),
      })),
    );
  });
