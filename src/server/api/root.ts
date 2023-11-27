import { createTRPCRouter } from "~/server/api/trpc";
import { setupRouter } from "./routers/setup";
import { authRouter } from "./routers/auth";
import { systemRouter } from "./routers/system";
import { projectRouter } from "./routers/projects";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  setup: setupRouter,
  auth: authRouter,
  system: systemRouter,
  projects: projectRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
