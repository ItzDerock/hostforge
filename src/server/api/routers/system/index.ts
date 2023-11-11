import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import os from "os";
import osu from "node-os-utils";
import { observable } from "@trpc/server/observable";

async function fetchSystemInfo() {
  const [cpuUsage, storage, memory] = await Promise.all([
    osu.cpu.usage(),
    osu.drive.info("/"),
    osu.mem.info(),
  ]);

  return {
    cpu: {
      usage: cpuUsage,
      cores: os.cpus().length,
    },

    storage: {
      used: parseInt(storage.usedGb),
      total: parseInt(storage.totalGb),
    },

    memory: {
      used: memory.usedMemMb / 1024,
      total: memory.totalMemMb / 1024,
    },
  };
}

export const systemRouter = createTRPCRouter({
  currentStats: authenticatedProcedure.query(async ({ ctx }) => {
    return fetchSystemInfo();
  }),

  liveStats: authenticatedProcedure.subscription(async ({ ctx }) => {
    return observable<Awaited<ReturnType<typeof fetchSystemInfo>>>(
      (observer) => {
        console.log("subscription got");
        fetchSystemInfo().then(observer.next.bind(observer));

        const interval = setInterval(async () => {
          observer.next(await fetchSystemInfo());
        }, 1000);

        return () => {
          clearInterval(interval);
        };
      },
    );
  }),
});
