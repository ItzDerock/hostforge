import { isDefined } from "~/utils/utils";
import { authenticatedProcedure } from "../../trpc";
import type { paths as DockerAPITypes } from "~/server/docker/types";
import logger from "~/server/utils/logger";

export const getHostsProcedure = authenticatedProcedure.query(
  async ({ ctx }) => {
    // get all the docker nodes and the netdata hosts
    const [dockerNodes, system, promHosts] = await Promise.all([
      ctx.docker.listNodes() as Promise<
        DockerAPITypes["/nodes"]["get"]["responses"]["200"]["schema"]
      >,
      ctx.docker.info() as Promise<
        DockerAPITypes["/info"]["get"]["responses"]["200"]["schema"]
      >,
      ctx.globalStore.internalServices.prometheus.getNodes().catch((err) => {
        logger.error("Failed to get prometheus nodes", err);
        return [];
      }),
    ]);

    // combine the nodes into a single array
    return dockerNodes
      .map((node) => {
        if (!node.ID) return;
        // find the corresponding prometheus node
        const cadvisor = promHosts.find(
          (n) => n.id === node.ID && n.job === "cadvisor",
        );

        const nodeExporter = promHosts.find(
          (n) => n.id === node.ID && n.job === "node-exporter",
        );

        return {
          id: node.ID,
          name: node.Description?.Hostname,
          role: node.Spec?.Role,
          status: node.Status?.State,
          isMainNode: node.ID === system.Swarm?.NodeID,
          stats: {
            cadvisor,
            nodeExporter,
          },
        };
      })
      .filter(isDefined);
  },
);
