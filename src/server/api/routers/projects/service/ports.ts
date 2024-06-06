import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { servicePort } from "~/server/db/schema";
import {
  DockerPortType,
  DOCKER_PORT_TYPE_MAP,
  DockerPublishMode,
  DOCKER_PUBLISH_MODE_MAP,
} from "~/server/db/types";
import { zReverseEnumLookup } from "~/server/utils/serverUtils";
import { createUpdateProcedure } from "~/server/utils/updateProcedure";

export const updateServicePortsProcedure = authenticatedProcedure
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
      data: z.array(
        z.strictObject({
          id: z.string().uuid().optional(),

          type: z
            .nativeEnum(DockerPortType)
            .or(zReverseEnumLookup<DockerPortType>(DOCKER_PORT_TYPE_MAP)),

          publishMode: z
            .nativeEnum(DockerPublishMode)
            .or(zReverseEnumLookup<DockerPublishMode>(DOCKER_PUBLISH_MODE_MAP)),

          internalPort: z.number().int().min(1).max(65535),
          externalPort: z.number().int().min(1).max(65535),
        }),
      ),
    }),
  )
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .mutation(createUpdateProcedure(servicePort));
