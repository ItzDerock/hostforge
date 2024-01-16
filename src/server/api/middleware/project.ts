import { TRPCError, experimental_standaloneMiddleware } from "@trpc/server";
import { eq, or } from "drizzle-orm";
import { type db } from "~/server/db";
import { projects } from "~/server/db/schema";

export type BasicProjectDetails = {
  id: string;
  friendlyName: string;
  internalName: string;
  createdAt: number;
};

export const projectMiddleware = experimental_standaloneMiddleware<{
  ctx: { db: typeof db };
  input: { projectId: string };
}>().create(async ({ ctx, input, next }) => {
  if (typeof input.projectId != "string") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Expected a project ID or internal name.",
    });
  }

  const [project] = await ctx.db
    .select({
      id: projects.id,
      friendlyName: projects.friendlyName,
      internalName: projects.internalName,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(
      or(
        eq(projects.id, input.projectId),
        eq(projects.internalName, input.projectId),
      ),
    )
    .limit(1);

  if (!project)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found or insufficient permissions.",
    });

  return next({
    ctx: {
      project: project as BasicProjectDetails,
    },
  });
});
