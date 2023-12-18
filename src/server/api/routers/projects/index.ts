import assert from "assert";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { projects, service } from "~/server/db/schema";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import { getProject } from "./project";

export const projectRouter = createTRPCRouter({
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
      const userProjects = await ctx.db
        .select({
          id: projects.id,
          friendlyName: projects.friendlyName,
          internalName: projects.internalName,
          createdAt: projects.createdAt,
        })
        .from(projects);

      return await Promise.all(
        userProjects.map(async (project) => {
          const projServices = await ctx.db
            .select({
              id: service.id,
              name: service.name,
            })
            .from(service)
            .where(eq(service.projectId, project.id));

          return {
            ...project,
            services: projServices,
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
});
