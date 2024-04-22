import assert from "assert";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { projects, serviceGeneration } from "~/server/db/schema";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import { deployProject } from "./deploy";
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
              id: serviceGeneration.id,
              name: serviceGeneration.name,
            })
            .from(serviceGeneration)
            .where(eq(serviceGeneration.serviceId, project.id));

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
  deploy: deployProject,
});
