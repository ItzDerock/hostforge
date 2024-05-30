import assert from "assert";
import { z } from "zod";
import { projects } from "~/server/db/schema";
import ProjectManager from "~/server/managers/Project";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import { deployProject, getDeployDiff } from "./deploy";
import { getProject } from "./project";
import { serviceRouter } from "./service";

export const projectRouter = createTRPCRouter({
  services: serviceRouter,

  list: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/api/projects",
        summary: "List projects",
      },
    })
    .input(z.void())
    .output(z.unknown())
    .query(async ({ ctx }) => {
      const projects = await ProjectManager.listForUser(
        ctx.session.data.userId,
      );

      // we love the nested Promise.all's
      // TODO: refactor
      return Promise.all(
        projects.map(async (project) => {
          return {
            ...project.getData(),
            services: await Promise.all(
              (await project.getServices()).map(async (service) => ({
                ...(await service.getDataWithGenerations()),
                redeploySecret: undefined,
                status: await service.getHealth(ctx.docker),
              })),
            ),
          };
        }),
      );
    }),

  create: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/api/projects",
        summary: "Create a project",
      },
    })
    .input(
      z.object({
        friendlyName: z.string(),
        internalName: z.string().regex(/^[a-z0-9-]+$/),
      }),
    )
    .output(z.string())
    .mutation(async ({ ctx, input }) => {
      const [data] = await ctx.db
        .insert(projects)
        .values({
          friendlyName: input.friendlyName,
          internalName: input.internalName,
          ownerId: ctx.session.data.userId,
        })
        .returning();

      assert(data, "Expected project data to be returned");

      return data.id;
    }),

  get: getProject,
  deploy: deployProject,
  deployDiff: getDeployDiff,
});
