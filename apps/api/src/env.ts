import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /**
   * Serverside environment variables
   */
  server: {
    port: z.number(),
    host: z.string(),
  },

  runtimeEnv: {
    port: process.env.PORT ?? "3000",
    host: process.env.HOST ?? "0.0.0.0",
  },
});
