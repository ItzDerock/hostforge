import { mkdir } from "fs/promises";
import { DockerInternalServices, DockerNetworks, getDockerInstance } from ".";
import Dockerode from "dockerode";
import logger from "../utils/logger";
import path from "path";
import { env } from "~/env";

const log = logger.child({ module: "docker/traefik" });

/**
 * The expected version of Traefik to be running.
 */
const EXPECTED_TRAEFIK_VERSION = "2.10";

/**
 * Storage locations
 */
const TRAEFIK_CONFIG_PATH = path.resolve(env.STORAGE_PATH, "traefik");

export function createTraefikServiceConfig() {
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
        Image: `traefik:${EXPECTED_TRAEFIK_VERSION}`,
        Args: [
          "--api",
          // TODO: remove this in production
          "--api.dashboard",

          "--providers.swarm.endpoint=unix:///var/run/docker.sock",
          "--providers.swarm.watch=true",
          "--providers.swarm.allowEmptyServices=true",

          // "--docker",
          // "--docker.swarmMode",
          // "--docker.domain=hostforge",
          // "--docker.watch",

          "--entrypoints.web.address=:80",
          "--entrypoints.websecure.address=:443",
          "--certificatesresolvers.acme.acme.email=derock@derock.dev", // TODO: change this
          "--certificatesresolvers.acme.acme.storage=/etc/traefik/acme.json",
          "--certificatesresolvers.acme.acme.httpchallenge.entrypoint=web",
        ],

        Mounts: [
          {
            Source: TRAEFIK_CONFIG_PATH,
            Target: "/etc/traefik",
            Type: "bind",
          },
          {
            Source: "/var/run/docker.sock",
            Target: "/var/run/docker.sock",
            Type: "bind",
          },
        ],
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
      Parallelism: 2,
      Order: "start-first",
    },
  } satisfies Dockerode.CreateServiceOptions;
}

export async function deployTraefik() {
  const docker = await getDockerInstance();
  await mkdir(TRAEFIK_CONFIG_PATH, { recursive: true });

  // create the networks
  await docker.createNetwork({
    Name: DockerNetworks.Public,
    CheckDuplicate: true,
    Driver: "overlay",
    Attachable: true,
  });

  await docker.createNetwork({
    Name: DockerNetworks.Internal,
    CheckDuplicate: true,
    Driver: "overlay",
    Attachable: false,
    Internal: true,
    // enable encryption
    Options: {
      encrypted: "true",
    },
  });

  const res = await docker.createService(createTraefikServiceConfig());
  log.info(`Traefik deployed: ${res.id}`);
}

export async function updateTraefik() {
  const docker = await getDockerInstance();

  const service = docker.getService(DockerInternalServices.Traefik);
  await service.update(createTraefikServiceConfig());

  log.info(`Traefik updated`);
}

export async function ensureTraefik() {
  const docker = await getDockerInstance();

  const service = docker.getService(DockerInternalServices.Traefik);

  const info = await service
    .inspect()
    .catch((err) => (err.statusCode === 404 ? null : Promise.reject(err)));

  if (!info) {
    await deployTraefik();
    return;
  }

  if (
    info.Spec.TaskTemplate.ContainerSpec.Image !==
    `traefik:${EXPECTED_TRAEFIK_VERSION}`
  ) {
    await updateTraefik();
  }
}

// deployTraefik();
