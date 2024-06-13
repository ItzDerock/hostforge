import { Docker } from "./docker";

// eslint-disable-next-line @typescript-eslint/require-await
export async function getDockerInstance() {
  return new Docker({}); // TODO: configurable host
}

/**
 * Constants used throughout this application.
 */
export enum DockerNetworks {
  // Public network that traefik is attached to
  Public = "hostforge-public",

  // Internal network for hostforge services
  Internal = "hostforge-internal",

  // Builders are attached to this so they can push images
  Registry = "hostforge-registry",
}

/**
 * Container names
 */
export enum DockerInternalServices {
  Traefik = "hostforge_internal_traefik",

  // Based off of stack.yml
  Registry = "hostforge_internal_registry",
  Prometheus = "hostforge_internal_prometheus",
}
