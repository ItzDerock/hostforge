import { Docker } from "./docker";

// eslint-disable-next-line @typescript-eslint/require-await
export async function getDockerInstance() {
  return new Docker(); // TODO: configurable host
}

/**
 * Constants used throughout this application.
 */
export enum DockerNetworks {
  Public = "hostforge-public",
  Internal = "hostforge-internal",
  ReverseProxy = "hostforge-reverse-proxy",
}

/**
 * Container names
 */
export enum DockerInternalServices {
  Traefik = "hostforge-traefik",
}
