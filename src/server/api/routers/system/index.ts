import { observable } from "@trpc/server/observable";
import { stats, type BasicServerStats } from "~/server/modules/stats";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import logger from "~/server/utils/logger";
import { getHostsProcedure } from "./hosts";
import { z } from "zod";

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

  history: authenticatedProcedure
    .input(
      z.object({
        instance: z.string()?.regex(/^[a-zA-Z0-9-]+$/),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.globalStore.internalServices.prometheus.getHistoricalSystemStats(
        {
          instance: input.instance,
        },
      );
    }),

  // core container options
  redeployTraefik: authenticatedProcedure.mutation(({ ctx }) => {
    setTimeout(() => {
      void ctx.globalStore.internalServices.traefik
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
