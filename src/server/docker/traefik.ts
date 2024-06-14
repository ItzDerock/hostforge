import { mkdir } from "fs/promises";
import { DockerInternalServices, DockerNetworks, getDockerInstance } from ".";
import type Dockerode from "dockerode";
import logger from "../utils/logger";
import path from "path";
import { env } from "~/env";
import { docker404ToNull } from "../utils/serverUtils";
import type { paths as DockerAPITypes } from "./types";
import type { GlobalStore } from "../managers/GlobalContext";

export class TraefikManager {
  private log = logger.child({ module: "docker/traefik" });

  /**
   * The expected version of Traefik to be running.
   */
  static readonly EXPECTED_TRAEFIK_VERSION = "v3";

  /**
   * Internal traefik configuration version.
   * Versions lower than this number will trigger a redeployment of traefik.
   */
  static readonly TRAEFIK_CONFIG_VERSION = 1;

  /**
   * Storage locations
   */
  static TRAEFIK_CONFIG_PATH = path.resolve(env.STORAGE_PATH, "traefik");

  constructor(private store: GlobalStore) {}

  public createTraefikServiceConfig() {
    const { letsencryptEmail } = this.store.settings.getSettings();

    return {
      Name: DockerInternalServices.Traefik,
      Networks: [
        // public network that all exposed services will be attached to
        {
          Target: DockerNetworks.Public,
        },
        // internal network for hostforge
        {
          Target: DockerNetworks.Internal,
        },
      ],

      TaskTemplate: {
        ContainerSpec: {
          Image: `traefik:${TraefikManager.EXPECTED_TRAEFIK_VERSION}`,
          Args: [
            "--api",
            // TODO: remove this in production
            "--api.dashboard",

            "--providers.swarm.endpoint=unix:///var/run/docker.sock",
            "--providers.swarm.watch=true",
            "--providers.swarm.allowEmptyServices=true",
            `--providers.swarm.network=${DockerNetworks.Public}`,

            "--entrypoints.web.address=:80",
            "--entrypoints.websecure.address=:443",
            `--certificatesresolvers.letsencrypt.acme.email=${letsencryptEmail}`,
            "--certificatesresolvers.letsencrypt.acme.storage=/etc/traefik/acme.json",
            "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web",
            "--certificatesresolvers.letsencrypt.acme.tlschallenge=true",

            "--providers.docker.constraints=Label(`traefik.constraint-label`, `hostforge-public`)",
            "--providers.docker.exposedByDefault=false",
          ],

          Mounts: [
            {
              Source: TraefikManager.TRAEFIK_CONFIG_PATH,
              Target: "/etc/traefik",
              Type: "bind",
            },
            {
              Source: "/var/run/docker.sock",
              Target: "/var/run/docker.sock",
              Type: "bind",
            },
          ],

          Labels: {
            "hostforge.traefik.configuration-version":
              TraefikManager.TRAEFIK_CONFIG_VERSION.toString(),
          },
        },

        Placement: {
          Constraints: ["node.role == manager"],
        },
      },

      EndpointSpec: {
        Ports: [
          {
            Name: "public-http",
            Protocol: "tcp",
            TargetPort: 80,
            PublishedPort: 80,
            PublishMode: "ingress",
          },
          {
            Name: "public-https",
            Protocol: "tcp",
            TargetPort: 443,
            PublishedPort: 443,
            PublishMode: "ingress",
          },

          // TODO: remove this in production
          {
            Name: "api",
            Protocol: "tcp",
            TargetPort: 8080,
            PublishedPort: 8080,
            PublishMode: "ingress",
          },
        ],
      },

      Mode: {
        Replicated: {
          Replicas: 1,
        },
      },

      UpdateConfig: {
        Parallelism: 1,
        Order: "start-first",
      },
    } satisfies Dockerode.CreateServiceOptions;
  }

  async deployTraefik() {
    const docker = await getDockerInstance();
    await mkdir(TraefikManager.TRAEFIK_CONFIG_PATH, { recursive: true });

    //  TODO: wait for networks before creation

    const res = await docker.createService(this.createTraefikServiceConfig());
    this.log.info(`Traefik deployed: ${res.id}`);
  }

  public async updateTraefik() {
    const docker = await getDockerInstance();

    const service = docker.getService(DockerInternalServices.Traefik);
    await service.update(this.createTraefikServiceConfig());

    this.log.info(`Traefik updated`);
  }

  public async ensureTraefik() {
    // skip checking if the instance hasn't been set up yet
    if (!this.store.settings.isInstanceSetup()) {
      this.log.debug("Skipping traefik check, instance not set up");
      return false;
    }

    await mkdir(TraefikManager.TRAEFIK_CONFIG_PATH, { recursive: true });

    const docker = await getDockerInstance();
    const service = docker.getService(DockerInternalServices.Traefik);

    const info = (await service.inspect().catch(docker404ToNull)) as
      | DockerAPITypes["/services/{id}"]["get"]["responses"]["200"]["schema"]
      | null;

    if (!info) {
      await this.deployTraefik();
      return;
    }

    if (
      info.Spec?.TaskTemplate?.ContainerSpec?.Image !==
      `traefik:${TraefikManager.EXPECTED_TRAEFIK_VERSION}`
    ) {
      // check version label
      const versionLabel = parseInt(
        info.Spec?.Labels?.["hostforge.traefik.configuration-version"] ?? "-1",
      );

      if (versionLabel < TraefikManager.TRAEFIK_CONFIG_VERSION) {
        this.log.info(
          `Traefik version mismatch. Redeploying. Current: ${versionLabel}, Expected: ${TraefikManager.TRAEFIK_CONFIG_VERSION}`,
        );

        await this.updateTraefik();
      }
    }
  }

  public async init() {
    // schedule regular traefik checks (every 5 mins)
    setInterval(() => void this.ensureTraefik(), 5 * 60 * 1000);
    await this.ensureTraefik().catch((err) => {
      this.log.error("Initial traefik loading failed", err);
    });
  }
}
