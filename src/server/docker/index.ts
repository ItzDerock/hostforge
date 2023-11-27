import Docker from "dockerode";

export async function getDockerInstance() {
  return new Docker(); // TODO: configurable host
}

/**
 * Constants used throughout this application.
 */
export enum DockerNetworks {
  Public = "hostforge-public",
  Internal = "hostforge-internal",
}

export enum DockerInternalServices {
  Traefik = "hostforge-traefik",
}
