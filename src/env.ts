import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

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
    SESSION_SECRET: z.string().min(8),
    HOSTNAME: z.string().default("localhost"),
    PORT: z
      .string()
      .default("3000")
      .transform((str) => parseInt(str)),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_PATH: process.env.DATABASE_PATH,
    NODE_ENV: process.env.NODE_ENV,
    SQLITE_UUIDV7_EXT_PATH: process.env.SQLITE_UUIDV7_EXT_PATH,
    SESSION_SECRET: process.env.SESSION_SECRET,
    HOSTNAME: process.env.HOSTNAME,
    PORT: process.env.PORT,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});