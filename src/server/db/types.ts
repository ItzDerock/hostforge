/**
 * Sources for services.
 * MUST KEEP THIS ORDER since it is stored as an integer in the database based on the enum index.
 */
export enum ServiceSource {
  /**
   * Pulls the image from any docker registry.
   */
  Docker,

  /**
   * Builds from GitHub with special GitHub integrations.
   */
  GitHub,

  /**
   * Builds from any other Git repository.
   */
  Git,
}

/**
 * Represents the build method for a service
 */
export enum ServiceBuildMethod {
  /**
   * Build the service from a Dockerfile
   */
  Dockerfile,

  /**
   * Builds the service using Heroku's buildpacks
   */
  Buildpacks,

  /**
   * Builds the service using Nixpacks
   */
  Nixpacks,
}

/**
 * Published port type
 */
export enum ServicePortType {
  TCP,
  UDP,
}

/**
 * Port mode
 */
export enum ServicePortMode {
  /**
   * Publish the port to the host
   */
  Host,

  /**
   * Will be load balanced by the ingress
   */
  Ingress,
}

export const SERVICE_PORT_MODE_MAP = {
  [ServicePortMode.Host]: "host",
  [ServicePortMode.Ingress]: "ingress",
} as const;

export enum DockerDeployMode {
  /**
   * Exactly one container per node
   */
  Global,

  /**
   * Spread containers across nodes
   */
  Replicated,
}

export const DOCKER_DEPLOY_MODE_MAP = {
  [DockerDeployMode.Global]: "global",
  [DockerDeployMode.Replicated]: "replicated",
};

export enum DockerRestartCondition {
  /**
   * Always restart the container
   */
  Always,

  /**
   * Never restart the container
   */
  Never,

  /**
   * Restart the container on failure
   */
  OnFailure,
}

export const DOCKER_RESTART_CONDITION_MAP = {
  [DockerRestartCondition.Always]: "always",
  [DockerRestartCondition.Never]: "no",
  [DockerRestartCondition.OnFailure]: "on-failure",
};

export enum DockerVolumeType {
  /**
   * Bind mount a host directory
   */
  Bind,

  /**
   * Mount a volume
   */
  Volume,

  /**
   * Mount a tmpfs
   */
  Tmpfs,
}