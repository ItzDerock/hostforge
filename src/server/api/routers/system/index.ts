import { observable } from "@trpc/server/observable";
import { stats, type BasicServerStats } from "~/server/modules/stats";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import logger from "~/server/utils/logger";
import { getHostsProcedure } from "./hosts";

export const systemRouter = createTRPCRouter({
  hosts: getHostsProcedure,

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

  history: authenticatedProcedure.query(async ({ ctx }) => {
    return ctx.globalStore.netdata.getHistoricalSystemStats();
    // return await stats.getStatsInRange(
    //   new Date(Date.now() - 1000 * 60 * 60 * 24),
    // );
  }),

  // core container options
  redeployTraefik: authenticatedProcedure.mutation(({ ctx }) => {
    setTimeout(() => {
      void ctx.globalStore.traefik
        .updateTraefik()
        .then(() => {
          logger.info("Traefik redeployed");
        })
        .catch((err) => {
          logger.error("Failed to redeploy traefik", err);
        });
    }, 200);

    return "ok";
  }),
});
