import { sql, relations } from "drizzle-orm";
import {
  text,
  blob,
  integer,
  sqliteTable,
  index,
  real,
} from "drizzle-orm/sqlite-core";

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
  userId: text("id").notNull(),
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
  userId: text("user_id"),
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
