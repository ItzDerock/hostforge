import { createTRPCRouter } from "~/server/api/trpc";
import { setupProcedure } from "./routers/setup";
import { authRouter } from "./routers/auth";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  setup: setupProcedure,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
