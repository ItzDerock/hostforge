import assert from "assert";
import type {
  service,
  serviceDomain,
  serviceGeneration,
  servicePort,
  serviceSysctl,
  serviceUlimit,
  serviceVolume,
} from "../db/schema/schema";
import {
  DOCKER_DEPLOY_MODE_MAP,
  DOCKER_RESTART_CONDITION_MAP,
  DockerDeployMode,
  DockerVolumeType,
  ServicePortType,
} from "../db/types";
import {
  type ComposeSpecification,
  type DefinitionsService,
  type Ulimits,
} from "./compose";
import { parse } from "dotenv";
import { emptyStringIs } from "~/utils/utils";

export type FullServiceGeneration = typeof serviceGeneration.$inferSelect & {
  service: typeof service.$inferSelect;

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
  services: FullServiceGeneration[],
): Promise<ComposeSpecification> {
  // create services
  const swarmServices: Record<string, DefinitionsService> = {};

  for (const service of services) {
    swarmServices[service.service.name] = {
      // TODO: cap_add, cap_drop
      command: emptyStringIs(service.command, undefined),
      deploy: {
        replicas:
          service.deployMode === DockerDeployMode.Replicated
            ? service.replicas
            : undefined, // replicas only work in replicated mode
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
            cpus: service.max_cpu?.toString() ?? undefined,
            memory: service.max_memory ?? undefined,
            // pids: service.max_pids ?? undefined,
          },
        },

        // restart_policy is not recommended for docker swarm,
        // https://stackoverflow.com/questions/51089549/docker-stack-deploy-with-restart-policy-throws-error-response-from-daemon-inva
        // past that, according to docs, 'any'/'always' behaves the same as 'on-failure'
        // so maybe we should remove this field entirely
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
          order: service.zeroDowntime ? "start-first" : "stop-first",
        },

        update_config: {
          parallelism: 0,
          order: service.zeroDowntime ? "start-first" : "stop-first",
        },
      },

      entrypoint: emptyStringIs(service.entrypoint, undefined),
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
        disable: service.healthcheckEnabled,
        test: service.healthcheckCommand ?? undefined,
        interval: service.healthcheckInterval ?? undefined,
        timeout: service.healthcheckTimeout ?? undefined,
        retries: service.healthcheckRetries ?? undefined,
        start_period: service.healthcheckStartPeriod ?? undefined,
      },

      logging: {
        driver: "json-file",
        options: {
          "max-size":
            service.loggingMaxSize === "-1" ? null : service.loggingMaxSize,
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
      const labels = (swarmServices[service.service.name]!.deploy!.labels ??=
        []);

      for (const domain of service.domains) {
        labels.push(
          `traefik.http.routers.${service.service.name}.rule=Host(\`${domain.domain}\`)`,
        );

        if (domain.https) {
          labels.push(`traefik.http.routers.${service.service.name}.tls=true`);
          labels.push(
            `traefik.http.routers.${service.service.name}.tls.certresolver=letsencrypt`,
          );
        }
      }

      // swarmServices[service.name]?.deploy!.labels!
      // TODO: domains
      // services[service.name].networks add hostforge-internal
    }
  }

  return {
    // No version field as 3.x and 2.x are considered legacy
    // https://docs.docker.com/compose/compose-file/04-version-and-name/
    // docs state that version is purely for backwards compatibility
    // version: "3.9",
    services: cleanObject(swarmServices),
  };
}

/**
 * Small utility function to clean out keys with null value from an object.
 * Useful because sometimes docker will treat `null` as '', causing issues.
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): T {
  for (const key in obj) {
    if (obj[key] === null) delete obj[key];
    if (typeof obj[key] === "object")
      // @ts-expect-error - idk how to type this any better
      obj[key] = cleanObject(obj[key] as Record<string, unknown>) as unknown;
  }

  return obj;
}
