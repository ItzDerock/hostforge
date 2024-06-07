import { authenticatedProcedure } from "../../trpc";
import type { paths as DockerAPITypes } from "~/server/docker/types";

export const getHostsProcedure = authenticatedProcedure.query(
  async ({ ctx }) => {
    // get all the docker nodes and the netdata hosts
    const [netdataNodes, dockerNodes] = await Promise.all([
      ctx.globalStore.netdata.getNodes(),
      ctx.docker.listNodes() as Promise<
        DockerAPITypes["/nodes"]["get"]["responses"]["200"]["schema"]
      >,
    ]);

    // combine the nodes into a single array
    return dockerNodes.map((node) => {
      if (!node.ID) return;
      // find the corresponding netdata node
      const netdataNode = netdataNodes.find((n) => n.nm?.endsWith(node.ID!));

      return {
        id: node.ID,
        name: node.Description?.Hostname,
        role: node.Spec?.Role,
        status: node.Status?.State,
        statsAvailable: !!netdataNode,
      };
    });
  },
);
