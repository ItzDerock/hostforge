import { observable } from "@trpc/server/observable";
import { updateTraefik } from "~/server/docker/traefik";
import { stats, type BasicServerStats } from "~/server/modules/stats";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";

export const systemRouter = createTRPCRouter({
  currentStats: authenticatedProcedure.query(async () => {
    return stats.getCurrentStats();
  }),

  liveStats: authenticatedProcedure.subscription(() => {
    return observable<BasicServerStats>((observer) => {
      const update = observer.next.bind(observer);

      stats.events.on("onUpdate", update);
      return () => {
        stats.events.off("onUpdate", update);
      };
    });
  }),

  history: authenticatedProcedure.query(async () => {
    return await stats.getStatsInRange(
      new Date(Date.now() - 1000 * 60 * 60 * 24),
    );
  }),

  // core container options
  redeployTraefik: authenticatedProcedure.mutation(() => {
    setTimeout(() => {
      void updateTraefik();
    }, 200);

    return "ok";
  }),
});
