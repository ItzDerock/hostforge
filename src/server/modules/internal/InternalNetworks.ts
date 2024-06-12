import type Dockerode from "dockerode";
import { DockerNetworks } from "~/server/docker";
import type { Docker } from "~/server/docker/docker";
import type { GlobalStore } from "~/server/managers/GlobalContext";
import logger from "~/server/utils/logger";

/**
 * @brief Responsible for creating and managing the internal networks.
 */
export class NetworkManager {
  private log = logger.child({ module: "internal-network" });
  private promise: Promise<void>;

  constructor(
    private globalStore: GlobalStore,
    private docker: Docker,
  ) {
    this.promise = this.createInternalNetworks()
      .then((created) => {
        if (created) {
          this.log.info("Created internal networks.");
        } else {
          this.log.debug("Internal networks already exist.");
        }
      })
      .catch((err) => {
        this.log.error("Failed to create internal networks", err);
      });
  }

  public async waitForNetworks() {
    return this.promise;
  }

  /**
   * @brief Creates the internal networks.
   */
  public async createInternalNetworks() {
    const NETWORKS = [
      {
        Name: DockerNetworks.Public,
        CheckDuplicate: true,
        Driver: "overlay",
        Attachable: true,
      },
      {
        Name: DockerNetworks.Internal,
        CheckDuplicate: true,
        Driver: "overlay",
        Attachable: true,
      },
      {
        Name: DockerNetworks.Registry,
        CheckDuplicate: true,
        Driver: "overlay",
        Attachable: true,
      },
    ] satisfies Dockerode.NetworkCreateOptions[];

    let created = false;

    // create the networks
    await Promise.all(
      NETWORKS.map(
        async (network) =>
          (created ||= await this.docker
            .createNetwork(network)
            .then(() => true)
            .catch((err: Error) => {
              if ("statusCode" in err && err.statusCode == 409) {
                // network already exists, ignore
                return false;
              }

              throw err;
            })),
      ),
    );

    return created;
  }
}
