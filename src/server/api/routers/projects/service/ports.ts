import { and, eq, notInArray } from "drizzle-orm";
import { ZodRecord, z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { serviceVolume } from "~/server/db/schema";
import {
  DockerVolumeType,
  DockerPortType,
  DOCKER_PORT_TYPE_MAP,
} from "~/server/db/types";
import { zReverseEnumLookup } from "~/server/utils/serverUtils";

export const updateServiceVolumesProcedure = authenticatedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: "/api/projects/:projectId/services/:serviceId/ports",
      summary: "Update service ports",
    },
  })
  .input(
    z.object({
      projectId: z.string(),
      serviceId: z.string(),
      volumes: z.array(
        z.strictObject({
          id: z.string().uuid().optional(),
          type: z
            .nativeEnum(DockerPortType)
            .or(zReverseEnumLookup(DOCKER_PORT_TYPE_MAP)),
          target: z.string().min(1),
          source: z.string().min(1),
        }),
      ),
    }),
  )
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .mutation(async ({ ctx, input }) => {});
