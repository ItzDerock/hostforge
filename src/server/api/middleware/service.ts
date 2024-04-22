import { TRPCError, experimental_standaloneMiddleware } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import { type db } from "~/server/db";
import { service } from "~/server/db/schema";
import { type BasicProjectDetails } from "./project";

export const serviceMiddleware = experimental_standaloneMiddleware<{
  ctx: { db: typeof db; project: BasicProjectDetails };
  input: { serviceId: string };
}>().create(async ({ ctx, input, next }) => {
  if (typeof input.serviceId != "string") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Expected a service ID or internal name.",
    });
  }

  if (typeof ctx.project?.id != "string") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Expected a project ID. (maybe projectMiddleware is not being used?)",
    });
  }

  const serviceDetails = await ctx.db.query.service.findFirst({
    where: and(
      eq(service.projectId, ctx.project.id),
      or(eq(service.name, input.serviceId), eq(service.id, input.serviceId)),
    ),

    with: {
      latestGeneration: true,
    },
  });

  if (!serviceDetails)
    throw new TRPCError({
      code: "NOT_FOUND",
      message:
        "Service not found or insufficient permissions: " + input.serviceId,
    });

  return next({
    ctx: {
      service: serviceDetails,
    },
  });
});
