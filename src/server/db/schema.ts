import { relations, sql } from "drizzle-orm";
import {
  blob,
  index,
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import {
  DockerDeployMode,
  DockerRestartCondition,
  type DockerVolumeType,
  type ServiceBuildMethod,
  type ServicePortType,
  type ServiceSource,
} from "./types";

// util
const uuidv7 = sql`(uuid_generate_v7())`;
const now = sql<number>`CURRENT_TIMESTAMP`;

/**
 * User table.
 * Represents a global user.
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id").default(uuidv7).primaryKey(),
    username: text("username").unique().notNull(),
    password: text("password"), // raw hash

    // user configuration
    mfaToken: blob("mfa_token"), // raw hash
  },
  (table) => ({
    usernameIdx: index("username_idx").on(table.username),
  }),
);

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  mfaRequestSessions: many(MFARequestSessions),
}));

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

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

/**
 * MFA Request Session.
 * The intermediate between successful basic/oauth login and a full session for users with MFA enabled
 */
export const MFARequestSessions = sqliteTable("mfa_request_sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").references(() => users.id),
  createdAt: integer("created_at").default(now),
});

export const MFARequestSessionRelations = relations(
  MFARequestSessions,
  ({ one }) => ({
    user: one(users, {
      fields: [MFARequestSessions.userId],
      references: [users.id],
    }),
  }),
);

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
    .references(() => users.id),
});

/**
 * Project services
 * Represents a service running in a project
 * TODO: individual user permissions
 */
export const service = sqliteTable(
  "service",
  {
    id: text("id").default(uuidv7).primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),

    name: text("name").notNull(),

    // service configuration
    source: integer("source").$type<ServiceSource>().notNull(),
    redeploySecret: text("redeploy_secret").notNull(),
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
    buildMethod: integer("build_method").$type<ServiceBuildMethod>(),
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
    name_project_idx: index("name_project_idx").on(table.name, table.projectId),
    name_project_unq: unique("name_project_unq").on(
      table.name,
      table.projectId,
    ),
  }),
);

// relations
export const projectRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  services: many(service),
}));

export const serviceRelations = relations(service, ({ one, many }) => ({
  project: one(projects, {
    fields: [service.projectId],
    references: [projects.id],
  }),
  domains: many(serviceDomain),
  ports: many(servicePort),
  sysctls: many(serviceSysctl),
  volumes: many(serviceVolume),
  ulimits: many(serviceUlimit),
}));

/**
 * Project domain settings
 */
export const serviceDomain = sqliteTable("service_domain", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => service.id),

  domain: text("domain").notNull(),
  internalPort: integer("internal_port").notNull(),
  https: integer("https", { mode: "boolean" }).default(false).notNull(),
  forceSSL: integer("force_ssl", { mode: "boolean" }).default(false).notNull(),
});

export const serviceDomainRelations = relations(serviceDomain, ({ one }) => ({
  service: one(service, {
    fields: [serviceDomain.serviceId],
    references: [service.id],
  }),
}));

/**
 * Project exposed ports
 */
export const servicePort = sqliteTable("service_port", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => service.id),

  internalPort: integer("internal_port").notNull(),
  externalPort: integer("external_port").notNull(),
  portType: integer("port_type").$type<ServicePortType>().notNull(),
  type: integer("type").$type<ServicePortType>().notNull(),
});

export const servicePortRelations = relations(servicePort, ({ one }) => ({
  service: one(service, {
    fields: [servicePort.serviceId],
    references: [service.id],
  }),
}));

/**
 * Project sysctls
 */
export const serviceSysctl = sqliteTable("service_sysctl", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => service.id),

  key: text("key").notNull(),
  value: text("value").notNull(),
});

export const serviceSysctlRelations = relations(serviceSysctl, ({ one }) => ({
  service: one(service, {
    fields: [serviceSysctl.serviceId],
    references: [service.id],
  }),
}));

/**
 * Project volumes
 */
export const serviceVolume = sqliteTable("service_volume", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => service.id),

  source: text("source"),
  target: text("target").notNull(),
  type: text("type").$type<DockerVolumeType>().notNull(),
});

export const serviceVolumeRelations = relations(serviceVolume, ({ one }) => ({
  service: one(service, {
    fields: [serviceVolume.serviceId],
    references: [service.id],
  }),
}));

/**
 * Project ulimits
 */
export const serviceUlimit = sqliteTable("service_ulimit", {
  id: text("id").default(uuidv7).primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => service.id),

  name: text("name").notNull(),
  soft: integer("soft").notNull(),
  hard: integer("hard").notNull(),
});

export const serviceUlimitRelations = relations(serviceUlimit, ({ one }) => ({
  service: one(service, {
    fields: [serviceUlimit.serviceId],
    references: [service.id],
  }),
}));
