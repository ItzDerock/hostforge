import { and, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { serviceVolume } from "~/server/db/schema";
import { DOCKER_VOLUME_TYPE_MAP, DockerVolumeType } from "~/server/db/types";
import {
  conflictUpdateAllExcept,
  zReverseEnumLookup,
} from "~/server/utils/serverUtils";

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
  .mutation(async ({ ctx, input }) => {
    const currentGeneration = ctx.service.getData().latestGenerationId;

    return await ctx.db.transaction(async (trx) => {
      // insert or update
      const wanted = await trx
        .insert(serviceVolume)
        .values(
          input.data.map((volume) => ({
            serviceId: currentGeneration,
            ...volume,
          })),
        )
        .onConflictDoUpdate({
          set: conflictUpdateAllExcept(serviceVolume, ["id"]),
          target: serviceVolume.id,
        })
        .returning();

      // delete any volumes that are not in the wanted list
      await trx.delete(serviceVolume).where(
        and(
          eq(serviceVolume.serviceId, currentGeneration),
          notInArray(
            serviceVolume.id,
            wanted.map((v) => v.id),
          ),
        ),
      );

      return wanted;
    });
  });
