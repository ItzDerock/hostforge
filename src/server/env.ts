import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /**
   * Serverside environment variables
   */
  server: {
    port: z.preprocess(Number, z.number()).default(3000),
    host: z.string().default("0.0.0.0"),
    dbPath: z.string().default("./data/sqlite.db"),
    dev: z
      .string()
      .default("development")
      .transform((v) => v.toLowerCase() !== "production"),
  },

  /**
   * Map environment variables to runtime environment
   */
  runtimeEnv: {
    port: process.env.PORT,
    host: process.env.HOST,
    dbPath: process.env.DB_PATH,
    dev: process.env.NODE_ENV,
  },
});
