import { join } from "path";
import type { GlobalStore } from "~/server/managers/GlobalContext";
import logger from "~/server/utils/logger";
import type { paths as DockerAPITypes } from "~/server/docker/types";
import { expectOrThrow } from "~/utils/utils";
import { hash } from "@node-rs/bcrypt";
import { ignore409 } from "~/server/docker/utils";

export class PrometheusStack {
  static readonly STACK_FOLDER = join(process.cwd(), "assets/services");
  private log = logger.child({ class: "services" });

  constructor(private store: GlobalStore) {}

  async init() {
    this.log.debug("Deploying internal service stack...");

    // await Promise.all([this.labelPrimary(), this.createRegistryConfig()]);
    await this.labelPrimary();

    const output = await this.store.docker
      .cli(
        ["stack", "deploy", "-c", "stack.yml", "--prune", "hostforge_internal"],
        {
          cwd: PrometheusStack.STACK_FOLDER,
        },
      )
      .catch((err) => {
        this.log.error("Failed to deploy stack", err);
        return false;
      });

    if (output !== false) this.log.debug("Interal service stack deployed.");
    return output;
  }

  private async labelPrimary() {
    // label this node as sh.hostforge.primary
    // and unlabel all other nodes
    const [nodes, system] = await Promise.all([
      this.store.docker.listNodes({
        filters: JSON.stringify({ label: ["sh.hostforge.primary=true"] }),
      }) as Promise<
        DockerAPITypes["/nodes"]["get"]["responses"]["200"]["schema"]
      >,
      this.store.docker.info() as Promise<
        DockerAPITypes["/info"]["get"]["responses"]["200"]["schema"]
      >,
    ]);

    // check if this node is labeled as primary
    const nodeId = expectOrThrow(system.Swarm?.NodeID, "Not part of a swarm");
    const isPrimary = nodes.length === 1 && nodes[0]!.ID === nodeId;

    if (!isPrimary) {
      this.log.debug(
        "This node is not marked as the primary node, fixing this issue.",
      );

      // unmark all nodes
      await Promise.all(
        nodes.map(
          (node) =>
            node.ID &&
            this.store.docker.cli([
              "node",
              "update",
              "--label-rm",
              "sh.hostforge.primary",
              node.ID,
            ]),
        ),
      );

      // mark this node as primary
      await this.store.docker.cli([
        "node",
        "update",
        "--label-add",
        "sh.hostforge.primary=true",
        nodeId,
      ]);
    }
  }

  private async createRegistryConfig() {
    // generate an htpasswd file for the registry
    // htpasswd -cB htpasswd hostforge
    const bcrypt = await hash(this.store.settings.getSettings().registrySecret);
    const Data = Buffer.from(`hostforge:${bcrypt}\n`).toString("base64");

    await this.store.docker
      .createConfig({
        Name: "hostforge-internal_registry-auth-1",
        Data, // RFC 4648
      })
      .catch(ignore409);
  }
}
