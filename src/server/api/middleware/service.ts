import { TRPCError, experimental_standaloneMiddleware } from "@trpc/server";
import { type db } from "~/server/db";
import type ProjectManager from "~/server/managers/Project";
import ServiceManager from "~/server/managers/Service";

export const serviceMiddleware = experimental_standaloneMiddleware<{
  ctx: { db: typeof db; project: ProjectManager };
  input: { serviceId: string };
}>().create(async ({ ctx, input, next }) => {
  if (typeof input.serviceId != "string") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Expected a service ID or internal name.",
    });
  }

  if (typeof ctx.project != "object") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Expected a project ID. (maybe projectMiddleware is not being used?)",
    });
  }

  const serviceDetails = await ServiceManager.findByNameOrId(
    input.serviceId,
    ctx.project.getData().id,
  );

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
