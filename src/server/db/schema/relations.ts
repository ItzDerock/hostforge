import { relations } from "drizzle-orm";
import {
  projectDeployment,
  projects,
  service,
  serviceDeployment,
  serviceDomain,
  serviceGeneration,
  servicePort,
  serviceSysctl,
  serviceUlimit,
  serviceVolume,
  sessions,
  users,
} from "./schema";

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  services: many(serviceGeneration),
}));

export const serviceGenerationRelations = relations(
  serviceGeneration,
  ({ one, many }) => ({
    service: one(service, {
      fields: [serviceGeneration.serviceId],
      references: [service.id],
    }),

    domains: many(serviceDomain),
    ports: many(servicePort),
    sysctls: many(serviceSysctl),
    volumes: many(serviceVolume),
    ulimits: many(serviceUlimit),

    deployment: one(serviceDeployment, {
      fields: [serviceGeneration.deploymentId],
      references: [serviceDeployment.id],
    }),
  }),
);

export const serviceRelations = relations(service, ({ one, many }) => ({
  project: one(projects, {
    fields: [service.projectId],
    references: [projects.id],
  }),

  generations: many(serviceGeneration),

  latestGeneration: one(serviceGeneration, {
    fields: [service.latestGenerationId],
    references: [serviceGeneration.id],
  }),

  deployedGeneration: one(serviceGeneration, {
    fields: [service.deployedGenerationId],
    references: [serviceGeneration.id],
  }),
}));

export const projectDeploymentRelations = relations(
  projectDeployment,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectDeployment.projectId],
      references: [projects.id],
    }),

    serviceDeployments: many(serviceDeployment),
  }),
);

export const serviceDomainRelations = relations(serviceDomain, ({ one }) => ({
  service: one(serviceGeneration, {
    fields: [serviceDomain.serviceId],
    references: [serviceGeneration.id],
  }),
}));

export const servicePortRelations = relations(servicePort, ({ one }) => ({
  service: one(serviceGeneration, {
    fields: [servicePort.serviceId],
    references: [serviceGeneration.id],
  }),
}));

export const serviceSysctlRelations = relations(serviceSysctl, ({ one }) => ({
  service: one(serviceGeneration, {
    fields: [serviceSysctl.serviceId],
    references: [serviceGeneration.id],
  }),
}));

export const serviceVolumeRelations = relations(serviceVolume, ({ one }) => ({
  service: one(serviceGeneration, {
    fields: [serviceVolume.serviceId],
    references: [serviceGeneration.id],
  }),
}));

export const serviceUlimitRelations = relations(serviceUlimit, ({ one }) => ({
  service: one(serviceGeneration, {
    fields: [serviceUlimit.serviceId],
    references: [serviceGeneration.id],
  }),
}));
