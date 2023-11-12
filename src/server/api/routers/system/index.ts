import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import { observable } from "@trpc/server/observable";
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
});
