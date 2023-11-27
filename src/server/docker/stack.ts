import assert from "assert";
import {
  service,
  serviceDomain,
  servicePort,
  serviceSysctl,
  serviceUlimit,
  serviceVolume,
} from "../db/schema";
import {
  DOCKER_DEPLOY_MODE_MAP,
  DOCKER_RESTART_CONDITION_MAP,
  DockerVolumeType,
  ServicePortType,
} from "../db/types";
import { ComposeSpecification, DefinitionsService, Ulimits } from "./compose";
import { parse } from "dotenv";

type Service = typeof service.$inferSelect & {
  domains: (typeof serviceDomain.$inferSelect)[];
  ports: (typeof servicePort.$inferSelect)[];
  sysctls: (typeof serviceSysctl.$inferSelect)[];
  volumes: (typeof serviceVolume.$inferSelect)[];
  ulimits: (typeof serviceUlimit.$inferSelect)[];

  /**
   * The final image to use for the service (after building)
   */
  finalizedDockerImage: string;
};

/**
 * Builds the docker stack file (as a JSON) for the given services and project.
 */
export async function buildDockerStackFile(
  services: Service[],
): Promise<ComposeSpecification> {
  // create services
  const swarmServices: Record<string, DefinitionsService> = {};

  for (const service of services) {
    swarmServices[service.name] = {
      // TODO: cap_add, cap_drop
      command: service.command,
      deploy: {
        replicas: service.replicas,
        endpoint_mode: "vip", // maybe dnsrr support?
        mode:
          service.deployMode !== null
            ? DOCKER_DEPLOY_MODE_MAP[service.deployMode]
            : undefined,
        placement: {
          max_replicas_per_node: service.maxReplicasPerNode ?? undefined,
        },
        // @ts-expect-error for some reason this is not in the types - https://docs.docker.com/compose/compose-file/compose-file-v3/#replicas
        replicas: service.replicas,

        resources: {
          limits: {
            cpus: service.max_cpu ?? undefined,
            memory: service.max_memory ?? undefined,
            pids: service.max_pids ?? undefined,
          },
        },

        restart_policy: {
          condition:
            service.restart !== null
              ? DOCKER_RESTART_CONDITION_MAP[service.restart]
              : undefined,

          delay: service.restartDelay ?? undefined,
          max_attempts: service.restartMaxAttempts ?? undefined,
        },

        rollback_config: {
          parallelism: 0,
          order: service.zeroDowntime === 1 ? "start-first" : "stop-first",
        },

        update_config: {
          parallelism: 0,
          order: service.zeroDowntime === 1 ? "start-first" : "stop-first",
        },
      },

      entrypoint: service.entrypoint,
      environment: service.environment ? parse(service.environment) : undefined,
      image: service.finalizedDockerImage,
      // ports: service.ports.map(
      //   (port) =>
      //     `${port.externalPort}:${port.internalPort}${
      //       port.portType === ServicePortType.UDP ? "/udp" : ""
      //     }`,
      // ),
      ports: service.ports.map((port) => ({
        mode:
          port.type !== null ? DOCKER_DEPLOY_MODE_MAP[port.type] : undefined,
        target: port.internalPort,
        published: port.externalPort,
        protocol: port.portType === ServicePortType.UDP ? "udp" : "tcp",
      })),

      healthcheck: {
        disable: service.healtcheckEnabled === 0,
        test: service.healthcheckCommand ?? undefined,
        interval: service.healthcheckInterval ?? undefined,
        timeout: service.healthcheckTimeout ?? undefined,
        retries: service.healthcheckRetries ?? undefined,
        start_period: service.healthcheckStartPeriod ?? undefined,
      },

      logging: {
        driver: "json-file",
        options: {
          "max-size": service.loggingMaxSize,
          "max-file": service.loggingMaxFiles,
        },
      },

      sysctls: Object.fromEntries(service.sysctls.map((s) => [s.key, s.value])),

      tmpfs: service.volumes
        .filter((volume) => volume.type === DockerVolumeType.Tmpfs)
        .map((volume) => volume.target),

      ulimits: Object.fromEntries(
        service.ulimits.map((ulimit) => [
          ulimit.name,
          {
            hard: ulimit.hard,
            soft: ulimit.soft,
          } satisfies Ulimits[string],
        ]),
      ),

      volumes: service.volumes
        .filter((volume) => volume.type !== DockerVolumeType.Tmpfs)
        .map((volume) => {
          assert(
            volume.source !== null,
            "volume source for non-tmpfs is null!",
          );
          return {
            type: volume.type === DockerVolumeType.Volume ? "volume" : "bind",
            source: volume.source,
            target: volume.target,
          };
        }),
    };

    if (service.domains.length > 0) {
      // swarmServices[service.name]?.deploy!.labels!
      // TODO: domains
      // services[service.name].networks add hostforge-internal
    }
  }

  return {
    version: "3.8",
  };
}
