import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { DockerInternalServices } from "./server/docker";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    // make sure to update drizzle.config.js if you change this
    DATABASE_PATH: z.string().default("./data/db.sqlite"),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    SQLITE_UUIDV7_EXT_PATH: z.string().optional(),
    HOSTNAME: z
      .string()
      .default(process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost"),

    PORT: z
      .string()
      .default("3000")
      .transform((str) => parseInt(str)),

    STORAGE_PATH: z.string().default("/var/lib/hostforge"),

    // TODO: remove this
    REDEPLOY_SECRET_BYTES: z
      .string()
      .default("32")
      .transform((str) => parseInt(str)),

    PROMETHEUS_URL: z
      .string()
      .default(`http://${DockerInternalServices.Prometheus}:9090`),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_BUILD_COMMIT_SHA: z.string().default("unknown"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_PATH: process.env.DATABASE_PATH,
    NODE_ENV: process.env.NODE_ENV,
    SQLITE_UUIDV7_EXT_PATH: process.env.SQLITE_UUIDV7_EXT_PATH,
    HOSTNAME: process.env.HOSTNAME,
    PORT: process.env.PORT,
    NEXT_PUBLIC_BUILD_COMMIT_SHA: process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA,
    STORAGE_PATH: process.env.STORAGE_PATH,
    REDEPLOY_SECRET_BYTES: process.env.REDEPLOY_SECRET_BYTES,
    PROMETHEUS_URL: process.env.PROMETHEUS_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
