// NOTE TO DEVELOPERS: The order of items CANNOT change as they are stored as integers based on the enum index in the database.
// IF YOU ADD A NEW ITEM, YOU MUST ADD IT TO THE END OF THE ENUM.

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
 * MUST KEEP THIS ORDER since it is stored as an integer in the database based on the enum index.
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
} as const satisfies {
  [key in DockerDeployMode]: string;
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
  [DockerRestartCondition.Always]: "any",
  [DockerRestartCondition.Never]: "never",
  [DockerRestartCondition.OnFailure]: "on-failure",
} as const satisfies {
  [key in DockerRestartCondition]: string;
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

export const DOCKER_VOLUME_TYPE_MAP = {
  [DockerVolumeType.Bind]: "bind",
  [DockerVolumeType.Volume]: "volume",
  [DockerVolumeType.Tmpfs]: "tmpfs",
} as const satisfies {
  [key in DockerVolumeType]: string;
};

export enum ServiceDeploymentStatus {
  /**
   * The service is waiting to be built. This may be because there are other builds in progress.
   * Not used for project deployments.
   */
  BuildPending,

  /**
   * The service is being built.
   */
  Building,

  /**
   * The service is deploying.
   */
  Deploying,

  /**
   * The deployment was successful.
   */
  Success,

  /**
   * The deployment failed.
   */
  Failed,
}
