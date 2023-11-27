import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import { projects, service } from "~/server/db/schema";
import assert from "assert";
import { eq } from "drizzle-orm";

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
          service: {
            id: service.id,
            name: service.name,
          },
        })
        .from(projects)
        .leftJoin(service, eq(projects.id, service.projectId))
        .where(eq(projects.ownerId, ctx.session.data.userId));

      return userProjects;
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
});
