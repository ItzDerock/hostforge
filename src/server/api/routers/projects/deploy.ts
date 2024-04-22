import { eq } from "drizzle-orm";
import { z } from "zod";
import { BuildManager } from "~/server/build/BuildManager";
import { serviceGeneration } from "~/server/db/schema";
import { buildDockerStackFile } from "~/server/docker/stack";
import logger from "~/server/utils/logger";
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
    const services = await ctx.db.query.service.findMany({
      where: eq(serviceGeneration.serviceId, input.projectId),

      with: {
        domains: true,
        ports: true,
        sysctls: true,
        volumes: true,
        ulimits: true,
      },
    });

    // run builds
    // TODO: run only if needed
    await BuildManager.getInstance().runBuilds(services);

    const dockerStackFile = await buildDockerStackFile(services);
    logger.debug("deploying stack", { dockerStackFile });

    const response = await ctx.docker.cli(
      ["stack", "deploy", "--compose-file", "-", ctx.project.internalName],
      {
        stdin: JSON.stringify(dockerStackFile),
      },
    );

    // TODO: stream progress to client
    // https://github.com/trpc/trpc/issues/4477
    // could do with ws, but very complicated
    return {
      response,
    };
  });
