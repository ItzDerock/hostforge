import type { ConfigReference, ServiceSpec } from "dockerode";
import { DockerNetworks } from "~/server/docker";
import type { GlobalStore } from "~/server/managers/GlobalContext";
import type { paths as DockerAPITypes } from "~/server/docker/types";
import { expectOrThrow } from "~/utils/utils";
import { stripIndent } from "common-tags";
import logger from "~/server/utils/logger";
import assert from "assert";
import { docker404ToNull } from "~/server/utils/serverUtils";
import { env } from "~/env";

/**
 * @brief This class is responsible for managing the netdata services.
 * @todo Maybe we should switch to prometheus + node-exporter?
 */
export class NetdataServiceManager {
  private static SERVICE_VERSION = 1;
  private static NETDATA_IMAGE = "netdata/netdata:v1.45";
  private static NETDATA_CENTRAL_CONF_NAME =
    "netdata_central_" + NetdataServiceManager.SERVICE_VERSION;
  private static NETDATA_CENTRAL_STREAM_CONF_NAME =
    "netdata_central_stream_" + NetdataServiceManager.SERVICE_VERSION;
  private static NETDATA_CLIENT_STREAM_CONF_NAME =
    "netdata_client_stream_" + NetdataServiceManager.SERVICE_VERSION;

  private static BASE_NETDATA_SPEC = {
    Name: "" as string, // replace
    TaskTemplate: {
      ContainerSpec: {
        Image: NetdataServiceManager.NETDATA_IMAGE,
        Hostname: "netdata-{{.Node.ID}}" as string,
        CapabilityAdd: ["SYS_PTRACE", "SYS_ADMIN"],
        Privileges: {
          // @ts-expect-error - types are out of date https://docs.docker.com/engine/api/v1.45/#tag/Service/operation/ServiceCreate
          AppArmor: {
            Mode: "disabled",
          },
        },
        Mounts: [
          {
            Source: "/proc",
            Target: "/host/proc",
            ReadOnly: true,
            Type: "bind",
          },
          {
            Source: "/sys",
            Target: "/host/sys",
            ReadOnly: true,
            Type: "bind",
          },
          {
            Source: "/var/run/docker.sock",
            Target: "/var/run/docker.sock",
            Type: "bind",
          },
          {
            Source: "netdata-lib",
            Target: "/var/lib/netdata",
            Type: "volume",
          },
        ],

        Configs: [] as ConfigReference[],
      },

      Placement: {
        Constraints: [] as string[],
        MaxReplicas: 1,
      },

      Networks: [
        {
          Target: DockerNetworks.Internal,
          Aliases: [] as string[],
        },
      ],
    },
    Mode: {
      Global: {}, // override this
      Replicated: undefined as { Replicas: number } | undefined,
    },
    Labels: {
      "sh.hostforge.netdata.version":
        NetdataServiceManager.SERVICE_VERSION.toString(),
    },
  } as const satisfies ServiceSpec;

  private log = logger.child({ module: "netdata/services" });
  private configIds: {
    central: string;
    centralStream: string;
    clientStream: string;
  } | null = null;

  /**
   * @brief Constructor for the NetdataServiceManager class.
   * @param globalStore The global store.
   * @param host The host.
   */
  constructor(private globalStore: GlobalStore) {}

  /**
   * @brief Deploys the central netdata service.
   */
  public async deployCentralNetdata() {
    this.log.debug(`Deploying central netdata service on node.`);

    const centralService: DeepWriteable<
      typeof NetdataServiceManager.BASE_NETDATA_SPEC
    > = structuredClone(NetdataServiceManager.BASE_NETDATA_SPEC);

    // add an alias to the network
    // BUG: this does not work...
    centralService.TaskTemplate.Networks[0].Aliases.push(
      "netdata_central",
      "hostforge_internal_netdata_central",
    );

    centralService.TaskTemplate.ContainerSpec.Hostname =
      "hostforge_internal_netdata_central";

    // add the constraint and disable global mode
    centralService.TaskTemplate.Placement.Constraints.push(
      `node.id == ${await this.getNodeId()}`,
    );

    // add the configs
    centralService.TaskTemplate.ContainerSpec.Configs.push(
      {
        ConfigName: NetdataServiceManager.NETDATA_CENTRAL_CONF_NAME,
        ConfigID: this.configIds?.central,
        File: {
          Name: "/etc/netdata/netdata.conf",
          UID: "0",
          GID: "0",
          Mode: 0o644,
        },
      },
      {
        ConfigName: NetdataServiceManager.NETDATA_CENTRAL_STREAM_CONF_NAME,
        ConfigID: this.configIds?.centralStream,
        File: {
          Name: "/etc/netdata/stream.conf",
          UID: "0",
          GID: "0",
          Mode: 0o644,
        },
      },
    );

    if (env.NODE_ENV === "development") {
      // publish the port
      (centralService as ServiceSpec).EndpointSpec = {
        Mode: "vip",
        Ports: [
          {
            Name: "netdata-public-ingress",
            TargetPort: 19999,
            PublishedPort: 19999,
            Protocol: "tcp",
            PublishMode: "host",
          },
        ],
      };
    }

    // set name
    centralService.Name = "hostforge_internal_netdata_central";

    const service = (await this.globalStore.docker
      .getService(centralService.Name)
      .inspect()
      .catch(docker404ToNull)) as
      | DockerAPITypes["/services/{id}"]["get"]["responses"]["200"]["schema"]
      | null;

    if (service?.ID) {
      return this.globalStore.docker.dial({
        path: `/services/${service.ID}/update?version=${
          service.Version!.Index
        }&`,
        method: "POST",
        options: centralService,
        statusCodes: {
          200: true,
          404: "Service not found",
          500: "Failed to update the service",
        },
      });
    } else {
      return this.globalStore.docker.createService(
        centralService as ServiceSpec,
      );
    }
  }

  /**
   * @brief Deploys the agent netdata service.
   */
  public async deployAgentNetdata() {
    const agentService: DeepWriteable<
      typeof NetdataServiceManager.BASE_NETDATA_SPEC
    > = structuredClone(NetdataServiceManager.BASE_NETDATA_SPEC);

    // set to global mode
    agentService.Mode.Global = {};

    // manager is running central, so we can constrain against it
    agentService.TaskTemplate.Placement.Constraints.push(
      `node.id != ${await this.getNodeId()}`,
    );

    // add config
    agentService.TaskTemplate.ContainerSpec.Configs.push({
      ConfigName: NetdataServiceManager.NETDATA_CLIENT_STREAM_CONF_NAME,
      ConfigID: this.configIds?.clientStream,
      File: {
        Name: "/etc/netdata/stream.conf",
        UID: "0",
        GID: "0",
        Mode: 0o644,
      },
    });

    // set name
    agentService.Name = "hostforge_internal_netdata_agent";

    // find service, if exists, update
    const service = (await this.globalStore.docker
      .getService("hostforge_internal_netdata_agent")
      .inspect()
      .catch(docker404ToNull)) as
      | DockerAPITypes["/services/{id}"]["get"]["responses"]["200"]["schema"]
      | null;

    if (service?.ID) {
      // update the service
      return this.globalStore.docker.dial({
        path: `/services/${service.ID}/update?version=${
          service.Version!.Index
        }&`,
        method: "POST",
        options: agentService,
        statusCodes: {
          200: true,
          404: "Service not found",
          500: "Failed to update the service",
        },
      });
    } else {
      return this.globalStore.docker.createService(agentService as ServiceSpec);
    }
  }

  /**
   * @brief Creates the configs for the netdata services.
   */
  public async createConfigs() {
    const token = this.globalStore.settings.getSettings().netdataToken;

    await this.globalStore.docker
      .createConfig({
        Name: NetdataServiceManager.NETDATA_CENTRAL_CONF_NAME,
        Data: Buffer.from(
          stripIndent`
            [web]
              bind to = *
              allow connections from = *
              allow dashboard from = *
              allow streaming from = *
          `,
        ).toString("base64"),
      } satisfies DockerAPITypes["/configs/create"]["post"]["parameters"]["body"]["body"])
      .catch(ignore409);

    await this.globalStore.docker
      .createConfig({
        Name: NetdataServiceManager.NETDATA_CENTRAL_STREAM_CONF_NAME,
        Data: Buffer.from(
          stripIndent`
            [${token}]
              enabled = yes
          `,
        ).toString("base64"),
      } satisfies DockerAPITypes["/configs/create"]["post"]["parameters"]["body"]["body"])
      .catch(ignore409);

    await this.globalStore.docker
      .createConfig({
        Name: NetdataServiceManager.NETDATA_CLIENT_STREAM_CONF_NAME,
        Data: Buffer.from(
          stripIndent`
            [stream]
              enabled = yes
              destination = hostforge_internal_netdata_central:19999
              api key = ${token}
            `,
        ).toString("base64"),
      } satisfies DockerAPITypes["/configs/create"]["post"]["parameters"]["body"]["body"])
      .catch(ignore409);

    // now find and return the config IDs
    const [central, centralStream, clientStream] = await Promise.all(
      [
        NetdataServiceManager.NETDATA_CENTRAL_CONF_NAME,
        NetdataServiceManager.NETDATA_CENTRAL_STREAM_CONF_NAME,
        NetdataServiceManager.NETDATA_CLIENT_STREAM_CONF_NAME,
      ].map(
        async (name) =>
          (
            await this.globalStore.docker
              .listConfigs({
                filters: JSON.stringify({
                  name: [name],
                }),
              })
              .catch((err) => {
                this.log.error("Failed to find config", err);
                throw err;
              })
          ).at(0)?.ID,
      ),
    );

    assert(
      central && centralStream && clientStream,
      "Failed to find all configs",
    );
    return (this.configIds = { central, centralStream, clientStream });
  }

  public async init() {
    await this.createConfigs();
    this.log.debug("Created netdata configs");

    await this.deployCentralNetdata();
    this.log.debug("Deployed central netdata service");

    await this.deployAgentNetdata();
    this.log.debug("Deployed agent netdata service");
  }

  private async getNodeId() {
    const currentNode = await this.globalStore.docker.dial<
      DockerAPITypes["/info"]["get"]["responses"]["200"]["schema"]
    >({
      path: "/info",
      statusCodes: {
        200: true,
        500: "Failed to get the current node",
      },
    });

    return expectOrThrow(
      currentNode.Swarm?.NodeID,
      "Failed to get the node ID",
    );
  }
}

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
const ignore409 = (err: Error) => {
  if ("statusCode" in err && err.statusCode == 409) {
    // network already exists, ignore
    return false;
  }

  throw err;
};
