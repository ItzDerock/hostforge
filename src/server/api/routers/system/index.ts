import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import os from "os";
import osu from "node-os-utils";

export const systemRouter = createTRPCRouter({
  current: authenticatedProcedure.query(async ({ ctx }) => {
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
  }),
});
