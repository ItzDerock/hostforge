import assert from "assert";
import { parse } from "dotenv";
import {
  type service,
  type serviceDomain,
  type servicePort,
  type serviceSysctl,
  type serviceUlimit,
  type serviceVolume,
} from "../db/schema";
import {
  DOCKER_DEPLOY_MODE_MAP,
  DOCKER_RESTART_CONDITION_MAP,
  DockerVolumeType,
  ServicePortType,
} from "../db/types";
import {
  type ComposeSpecification,
  type DefinitionsService,
  type Ulimits,
} from "./compose";

export type Service = typeof service.$inferSelect & {
  domains: (typeof serviceDomain.$inferSelect)[];
  ports: (typeof servicePort.$inferSelect)[];
  sysctls: (typeof serviceSysctl.$inferSelect)[];
  volumes: (typeof serviceVolume.$inferSelect)[];
  ulimits: (typeof serviceUlimit.$inferSelect)[];

  /**
   * The final image to use for the service (after building)
   */
  finalizedDockerImage?: string;
};

/**
 * Builds the docker stack file (as a JSON) for the given services and project.
 * Currently no async operations are performed, but this may change in the future.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function buildDockerStackFile(
  services: Service[],
): Promise<ComposeSpecification> {
  // create services
  const swarmServices: Record<string, DefinitionsService> = {};

  for (const service of services) {
    swarmServices[service.name] = {
      // TODO: cap_add, cap_drop
      command: service.command ?? undefined,
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

      entrypoint: service.entrypoint ?? undefined,
      environment: service.environment ? parse(service.environment) : undefined,
      image: service.finalizedDockerImage ?? service.dockerImage ?? undefined,
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
    services: swarmServices,
  };
}
