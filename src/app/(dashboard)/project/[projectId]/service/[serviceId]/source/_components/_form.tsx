import { z } from "zod";
import { ServiceSource, ServiceBuildMethod } from "~/server/db/types";
import { zDockerImage } from "~/server/utils/zod";

export const formValidator = z.object({
  source: z.nativeEnum(ServiceSource),

  dockerImage: zDockerImage.nullable(),
  dockerRegistryUsername: z.string().optional(),
  dockerRegistryPassword: z.string().optional(),

  githubUsername: z.string().optional(),
  githubRepository: z.string().optional(),
  githubBranch: z.string().optional(),

  buildMethod: z.nativeEnum(ServiceBuildMethod),
  buildPath: z.string().default("/"),
});
