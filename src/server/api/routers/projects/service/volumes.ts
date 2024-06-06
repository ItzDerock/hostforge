import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { serviceVolume } from "~/server/db/schema";
import { DOCKER_VOLUME_TYPE_MAP, DockerVolumeType } from "~/server/db/types";
import { zReverseEnumLookup } from "~/server/utils/serverUtils";
import { createUpdateProcedure } from "~/server/utils/updateProcedure";

export const updateServiceVolumesProcedure = authenticatedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: "/api/projects/:projectId/services/:serviceId/volumes",
      summary: "Update service volumes",
    },
  })
  .input(
    z.object({
      projectId: z.string(),
      serviceId: z.string(),
      data: z.array(
        z.strictObject({
          id: z.string().uuid().optional(),
          type: z
            .nativeEnum(DockerVolumeType)
            .or(zReverseEnumLookup<DockerVolumeType>(DOCKER_VOLUME_TYPE_MAP)),

          target: z.string().min(1),
          source: z.string().min(1),
        }),
      ),
    }),
  )
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .mutation(createUpdateProcedure(serviceVolume));
