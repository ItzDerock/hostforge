import { and, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { serviceVolume } from "~/server/db/schema";
import { DockerVolumeType } from "~/server/db/types";

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
      volumes: z.array(
        z.strictObject({
          mountId: z.string().uuid().optional(),
          type: z
            .nativeEnum(DockerVolumeType)
            .or(
              z
                .enum(["bind", "volume", "tmpfs"])
                .transform((val) =>
                  val === "bind"
                    ? DockerVolumeType.Bind
                    : val === "volume"
                      ? DockerVolumeType.Volume
                      : DockerVolumeType.Tmpfs,
                ),
            ),
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
      const wanted = (
        await Promise.all(
          input.volumes.map(async (volume) =>
            trx
              .insert(serviceVolume)
              .values({
                id: volume.mountId,
                serviceId: currentGeneration,
                type: volume.type,
                target: volume.target,
                source: volume.source,
              })
              .onConflictDoUpdate({
                set: {
                  type: volume.type,
                  target: volume.target,
                  source: volume.source,
                },
                target: serviceVolume.id,
                targetWhere: eq(serviceVolume.serviceId, currentGeneration),
              })
              .returning(),
          ),
        )
      ).flat();

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
