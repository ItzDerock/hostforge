import { sql } from "drizzle-orm";
import {
  blob,
  index,
  integer,
  real,
  sqliteTable,
  text,
  unique,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import {
  DockerDeployMode,
  DockerRestartCondition,
  ServiceBuildMethod,
  type DockerVolumeType,
  type ServiceDeploymentStatus,
  type ServicePortType,
  type ServiceSource,
} from "../types";

// util
const uuidv7 = sql`(uuid_generate_v7())`;
const now = sql<number>`CURRENT_TIMESTAMP`;

// overview of the project schema layout
// https://drawsql.app/teams/derock/diagrams/hostforge
// does not include all fields, just the main ones
// easy to see the relations between tables

/**
 * Global instance settings
 */
export const instanceSettings = sqliteTable("instance_settings", {
  id: integer("id").primaryKey(),
  letsencryptEmail: text("letsencrypt_email"),
  sessionSecret: text("session_secret").notNull(),
});

/**
 * User table.
 * Represents a global user.
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id").default(uuidv7).primaryKey(),
    username: text("username").unique().notNull(),
    password: text("password"),

    // user configuration
    mfaToken: blob("mfa_token"), // raw hash
  },
  (table) => ({
    usernameIdx: index("username_idx").on(table.username),
  }),
);

/**
 * User Session table.
 * Represents a user's session.
 */
export const sessions = sqliteTable("session", {
  token: text("token").primaryKey(),
  lastUA: text("last_useragent"),
  lastIP: text("last_ip"),

  // NOT IN MILLISECONDS!
  lastAccessed: integer("last_accessed", { mode: "timestamp" }),
  createdAt: integer("created_at").default(now).notNull(),
  userId: text("id")
    .notNull()
    .references(() => users.id),
});

/**
 * System Statistics
 * Historical data about the system's usage
 */
export const systemStats = sqliteTable("system_stats", {
  timestamp: integer("id").primaryKey().default(now),

  // percent as decimal * 10_000 to keep 2 decimal places
  cpuUsage: integer("cpu_usage"),

  // everything else is in megabytes
  memoryUsage: integer("memory_usage").notNull(),
  diskUsage: integer("disk_usage").notNull(),
  networkTx: integer("network_tx").notNull(),
  networkRx: integer("network_rx").notNull(),
});

/**
 * Project table.
 * Represents a project.
 * TODO: individual user permissions
 */
export const projects = sqliteTable("projects", {
  id: text("id").default(uuidv7).primaryKey(),
  friendlyName: text("friendly_name").notNull(),
  internalName: text("internal_name").notNull().unique(),

  createdAt: integer("created_at").default(now).notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
});

/**
 * Aggregate of service deployments for a project
 */
export const projectDeployment = sqliteTable(
  "project_deployment",
  {
    id: text("id").default(uuidv7).primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
      }),

    deployedAt: integer("deployed_at").default(now).notNull(),
    status: integer("status").$type<ServiceDeploymentStatus>().notNull(),
  },
  (table) => ({
    proj_deployment_idx: index("proj_deployment_idx").on(
      table.id,
      table.projectId,
    ),
  }),
);

/**
 * Project services
 * Represents a service running in a project
 * TODO: individual user permissions
 */
export const service = sqliteTable(
  "service",
  {
    id: text("id").default(uuidv7).primaryKey(),
    name: text("name").notNull(),

    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
      }),

    // https://github.com/drizzle-team/drizzle-orm/issues/2252
    // Must manually add `DEFERRABLE INITIALLY DEFERRED`
    latestGenerationId: text("latest_generation_id")
      .notNull()
      .references(() => serviceGeneration.id),

    // latestGenerationId: sql<string>`service_generation_id REFERENCES service_generation(id) NOT NULL `,

    redeploySecret: text("redeploy_secret").notNull(),
    deployedGenerationId: text("deployed_generation_id").references(
      () => serviceGeneration.id,
    ),

    createdAt: integer("created_at").default(now).notNull(),
  },
  (table) => ({
    name_project_idx: index("name_project_idx").on(table.name, table.projectId),
    name_project_unq: unique("name_project_unq").on(
      table.name,
      table.projectId,
    ),
  }),
);

/**
 * Configuration at a point in time for a service
 */
export const serviceGeneration = sqliteTable(
  "service_generation",
  {
    id: text("id").default(uuidv7).primaryKey(),

    // If a new relation is added, make sure it is properly cloned
    // inside of ServiceManager#cloneGeneration
    serviceId: text("service_id")
      .notNull()
      .references((): AnySQLiteColumn => service.id, {
        onDelete: "cascade",
      }),

    deploymentId: text("deployment_id").references(
      (): AnySQLiteColumn => serviceDeployment.id,
    ),

    // service configuration
    source: integer("source").$type<ServiceSource>().notNull(),
    environment: text("environment"),

    // for docker source
    dockerImage: text("docker_image"),
    dockerRegistryUsername: text("docker_registry_username"),
    dockerRegistryPassword: text("docker_registry_password"),

    // for github source
    // https://github.com/{username}/{repo}
    githubUsername: text("github_username"),
    githubRepository: text("github_repository"),
    githubBranch: text("github_branch"),

    // for git source
    gitUrl: text("git_url"),
    gitBranch: text("git_branch"),

    // for github/git
    buildMethod: integer("build_method")
      .$type<ServiceBuildMethod>()
      .notNull()
      .default(ServiceBuildMethod.Nixpacks),

    buildPath: text("build_path").default("/").notNull(),

    // deployment settings
    command: text("command"),
    entrypoint: text("entrypoint"),
    replicas: integer("replicas").default(1).notNull(),
    maxReplicasPerNode: integer("max_replicas_per_node"),
    deployMode: integer("deploy_mode")
      .$type<DockerDeployMode>()
      .default(DockerDeployMode.Replicated)
      .notNull(),

    zeroDowntime: integer("zero_downtime", { mode: "boolean" })
      .default(false)
      .notNull(),

    // deployment usage limits
    max_cpu: real("max_cpu").default(0).notNull(),
    max_memory: text("max_memory").default("0").notNull(),
    max_pids: integer("max_pids", { mode: "boolean" }).default(false).notNull(),

    // restart policy
    restart: integer("restart")
      .$type<DockerRestartCondition>()
      .default(DockerRestartCondition.OnFailure)
      .notNull(),

    // format: https://docs.docker.com/compose/compose-file/compose-file-v3/#specifying-durations
    restartDelay: text("restart_delay").default("5s"),
    restartMaxAttempts: integer("restart_max_attempts"),

    // healthcheck
    healthcheckEnabled: integer("healthcheck_enabled", { mode: "boolean" })
      .default(false)
      .notNull(),
    healthcheckCommand: text("healthcheck_command"),
    healthcheckInterval: text("healthcheck_interval").default("30s").notNull(),
    healthcheckTimeout: text("healthcheck_timeout").default("30s").notNull(),
    healthcheckRetries: integer("healthcheck_retries").default(3).notNull(),
    healthcheckStartPeriod: text("healthcheck_start_period")
      .default("0s")
      .notNull(),

    // logging
    // https://docs.docker.com/config/containers/logging/json-file/#options
    loggingMaxSize: text("logging_max_size").default("-1").notNull(),
    loggingMaxFiles: integer("logging_max_files").default(1).notNull(),

    createdAt: integer("created_at").default(now).notNull(),
  },
  (table) => ({
    proj_generation_idx: index("proj_generation_idx").on(
      table.id,
      table.serviceId,
    ),
  }),
);

/**
 * Service deployments
 */
export const serviceDeployment = sqliteTable("service_deployment", {
  id: text("id").default(uuidv7).primaryKey(),
  projectDeploymentId: text("project_deployment_id").references(
    () => projectDeployment.id,
    {
      onDelete: "cascade",
    },
  ),

  serviceId: text("service_id")
    .notNull()
    .references(() => service.id, {
      onDelete: "cascade",
    }),

  deployedAt: integer("created_at").default(now).notNull(),
  deployedBy: text("deployed_by").references(() => users.id),

  // logs will be pretty small,
  // so we can store them as blobs
  // https://www.sqlite.org/intern-v-extern-blob.html
  buildLogs: blob("build_logs"), // COMPRESSED!

  status: integer("status").$type<ServiceDeploymentStatus>().notNull(),
});

/**
 * Project domain settings
 */
export const serviceDomain = sqliteTable("service_domain", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => serviceGeneration.id),

  domain: text("domain").notNull(),
  internalPort: integer("internal_port").notNull(),
  https: integer("https", { mode: "boolean" }).default(false).notNull(),
  forceSSL: integer("force_ssl", { mode: "boolean" }).default(false).notNull(),
});

/**
 * Project exposed ports
 */
export const servicePort = sqliteTable("service_port", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => serviceGeneration.id),

  internalPort: integer("internal_port").notNull(),
  externalPort: integer("external_port").notNull(),
  portType: integer("port_type").$type<ServicePortType>().notNull(),
  type: integer("type").$type<ServicePortType>().notNull(),
});

/**
 * Project sysctls
 */
export const serviceSysctl = sqliteTable("service_sysctl", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => serviceGeneration.id),

  key: text("key").notNull(),
  value: text("value").notNull(),
});

/**
 * Project volumes
 */
export const serviceVolume = sqliteTable("service_volume", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => serviceGeneration.id),

  source: text("source"),
  target: text("target").notNull(),
  type: text("type").$type<DockerVolumeType>().notNull(),
});

/**
 * Project ulimits
 */
export const serviceUlimit = sqliteTable("service_ulimit", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => serviceGeneration.id),

  name: text("name").notNull(),
  soft: integer("soft").notNull(),
  hard: integer("hard").notNull(),
});
