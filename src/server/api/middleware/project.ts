import { TRPCError, experimental_standaloneMiddleware } from "@trpc/server";
import { type db } from "~/server/db";
import ProjectManager from "~/server/managers/Project";

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

  const project = await ProjectManager.findByNameOrId(input.projectId);

  if (!project)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found or insufficient permissions.",
    });

  return next({
    ctx: {
      project: project,
    },
  });
});
