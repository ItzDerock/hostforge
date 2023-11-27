import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import { observable } from "@trpc/server/observable";
import { updateTraefik } from "~/server/docker/traefik";
import { BasicServerStats, stats } from "~/server/modules/stats";

export const systemRouter = createTRPCRouter({
  currentStats: authenticatedProcedure.query(async ({ ctx }) => {
    return stats.getCurrentStats();
  }),

  liveStats: authenticatedProcedure.subscription(async ({ ctx }) => {
    return observable<BasicServerStats>((observer) => {
      const update = observer.next.bind(observer);

      stats.events.on("onUpdate", update);
      return () => {
        stats.events.off("onUpdate", update);
      };
    });
  }),

  history: authenticatedProcedure.query(async ({ ctx }) => {
    return await stats.getStatsInRange(
      new Date(Date.now() - 1000 * 60 * 60 * 24),
    );
  }),

  // core container options
  redeployTraefik: authenticatedProcedure.mutation(async ({ ctx }) => {
    setTimeout(() => {
      void updateTraefik();
    }, 200);

    return "ok";
  }),
});
