import { and, eq, or } from "drizzle-orm";
import { Operation, diff, type IChange } from "json-diff-ts";
import assert from "node:assert";
import type { paths as DockerAPITypes } from "~/server/docker/types";
import { db } from "../db";
import {
  service,
  serviceDomain,
  serviceGeneration,
  servicePort,
  serviceSysctl,
  serviceUlimit,
  serviceVolume,
} from "../db/schema";
import { ServiceSource } from "../db/types";
import type { Docker } from "../docker/docker";
import logger from "../utils/logger";
import Deployment from "./Deployment";
import type ProjectManager from "./Project";

export default class ServiceManager {
  private static LOGGER = logger.child({
    module: "ServiceManager",
  });

  constructor(
    private serviceData: typeof service.$inferSelect & {
      latestGeneration?: typeof serviceGeneration.$inferSelect;
      deployedGeneration?: typeof serviceGeneration.$inferSelect;
    },
    private parentProject: ProjectManager,
  ) {}

  /**
   * Finds a service by name or ID.
   */
  static async findByNameOrId(nameOrId: string, project: ProjectManager) {
    const data = await db.query.service.findFirst({
      where: and(
        eq(service.projectId, project.getData().id),
        or(eq(service.name, nameOrId), eq(service.id, nameOrId)),
      ),
    });

    return data ? new ServiceManager(data, project) : null;
  }

  public getData() {
    return this.serviceData;
  }

  public async getDataWithGenerations() {
    return {
      ...this.serviceData,
      latestGeneration:
        this.serviceData.latestGeneration ??
        (await this.fetchLatestGeneration()),
      deployedGeneration:
        this.serviceData.deployedGeneration ??
        (await this.fetchDeployedGeneration()),
    };
  }

  /**
   * Returns a list of changed parameters between the current deployed service and the latest generation.
   */
  public async buildDeployDiff() {
    if (
      this.serviceData.latestGenerationId ===
      this.serviceData.deployedGenerationId
    ) {
      logger.debug(
        `Service ${this.serviceData.name} has same deployed and latest generation. No changes to deploy.`,
      );

      return [];
    }

    // fetch the generations
    const [latest, deployed] = await Promise.all([
      this.fetchLatestGeneration(),
      this.fetchDeployedGeneration(),
    ]);

    // new service
    if (!deployed) {
      return {
        key: "serviceId",
        type: Operation.ADD,
      } satisfies IChange;
    }

    // compare the two
    return diff(
      {
        ...deployed,
        id: undefined,
        deploymentId: undefined,
        serviceId: undefined,
      },
      {
        ...latest,
        id: undefined,
        deploymentId: undefined,
        serviceId: undefined,
      },
    );
  }

  /**
   * Returns true if there has been a configuration change
   */
  public async hasPendingChanges() {
    const diff = await this.buildDeployDiff();

    // if the service was just created, return true
    if (
      "type" in diff &&
      diff.type === Operation.ADD &&
      diff.key === "serviceId"
    )
      return true;

    return (diff as IChange[]).length > 0;
  }

  /**
   * Checks if the source has changed between the deployed and latest generation.
   * If true, then a image build is required.
   */
  public async requiresImageBuild() {
    const diff = await this.buildDeployDiff();
    const latestGen = await this.fetchLatestGeneration();

    // if latest gen has dockerimage source, no build required
    if (latestGen.source === ServiceSource.Docker) {
      return false;
    }

    // TODO: implement
    logger.debug("Service diff", { diff });

    return Object.keys(diff).length > 0;
  }

  /**
   * Sets the current latest generation as the deployed generation, and creates a copy for the new latest generation.
   * @param deploymentId - the new deployed generation will have this deploymentId.
   */
  public async deriveNewGeneration(deploymentId?: string) {
    // do as much as possible on the database
    await db.transaction(async (trx) => {
      // clone the latest generation
      const originalLatestGeneration =
        await trx.query.serviceGeneration.findFirst({
          where: eq(serviceGeneration.id, this.serviceData.latestGenerationId),
        });

      assert(originalLatestGeneration, "Could not find latest generation??");

      // Since this will become the new latest generation, delete the deploymentId.
      originalLatestGeneration.deploymentId = null;

      // delete the ID so we can insert it again
      // @ts-expect-error i dont feel like typing it as optional
      delete originalLatestGeneration.id;

      // insert the cloned generation
      // this will become the new latest generation
      const [clonedLatestGeneration] = await trx
        .insert(serviceGeneration)
        .values(originalLatestGeneration)
        .returning({ id: serviceGeneration.id });

      assert(clonedLatestGeneration, "Cloned generation was null!");

      // now copy all domains, ports, sysctls, ulimits, and volumes
      // from the original latest generation to the cloned generation
      // this looks so messy but idk a better way since there's no CLONE sql command
      await Promise.all(
        [
          serviceDomain,
          servicePort,
          serviceSysctl,
          serviceUlimit,
          serviceVolume,
        ].map(async (table) => {
          const data = await trx
            .select()
            .from(table)
            .where(eq(table.serviceId, this.serviceData.latestGenerationId))
            .execute()
            .then((data) => {
              return data.map((row) => {
                // @ts-expect-error i dont feel like typing it as optional
                delete row.id;
                row.serviceId = clonedLatestGeneration.id;
                return row;
              });
            });

          if (data.length > 0) await trx.insert(table).values(data);
        }),
      );

      await Promise.all([
        // update the service's latest gen to point to the cloned generation
        // and set the deployed gen to the original
        trx
          .update(service)
          .set({
            latestGenerationId: clonedLatestGeneration.id,
            deployedGenerationId: this.serviceData.latestGenerationId,
          })
          .where(eq(service.id, this.serviceData.id)),

        // update the deploymentId of the original generation
        trx
          .update(serviceGeneration)
          .set({
            deploymentId: deploymentId ?? null,
          })
          .where(eq(serviceGeneration.id, this.serviceData.latestGenerationId)),
      ]);
    });

    await this.refetch();
  }

  public async fetchFullLatestGeneration() {
    return await db.query.serviceGeneration.findFirst({
      where: eq(serviceGeneration.id, this.serviceData.latestGenerationId),
      with: {
        domains: true,
        ports: true,
        service: true,
        sysctls: true,
        ulimits: true,
        volumes: true,
      },
    });
  }

  public async getDeployment(deploymentId: string) {
    const deployment = await db.query.serviceDeployment.findFirst({
      where: (tbl, { eq }) => eq(tbl.id, deploymentId),
      columns: {
        deployedAt: true,
        deployedBy: true,
        id: true,
        projectDeploymentId: true,
        serviceId: true,
        buildLogs: false,
        status: true,
      },
    });

    if (!deployment) return null;

    return new Deployment(deployment, this);
  }

  public toDockerServiceName() {
    const parent = this.parentProject.getData().internalName;
    const service = this.serviceData.name;

    return `${parent}_${service}`;
  }

  public async getHealth(docker: Docker) {
    const params = new URLSearchParams({
      filters: JSON.stringify({ name: [this.toDockerServiceName()] }),
      status: "true",
    });

    const res = await docker.dial<
      DockerAPITypes["/services"]["get"]["responses"]["200"]["schema"]
    >({
      path: "/services?" + params.toString() + "&", // trailing and cus sometimes docker cuts off the last char
      method: "GET",
      statusCodes: {
        200: true,
        404: "no such service",
        500: "server error",
        503: "node is not part of a swarm",
      },
    });

    if (res.length > 1) {
      logger.warn("Multiple services with the same name", {
        serviceName: this.toDockerServiceName(),
        res,
      });
    }

    return res[0]?.ServiceStatus;
  }

  /**
   * Fetches the latest generation of the service.
   * @param forceRefetch if true, will ignore what's cached internally
   * @returns
   */
  private async fetchLatestGeneration(forceRefetch?: boolean) {
    if (!forceRefetch && this.serviceData.latestGeneration) {
      return this.serviceData.latestGeneration;
    }

    this.serviceData.latestGeneration =
      await db.query.serviceGeneration.findFirst({
        where: eq(serviceGeneration.id, this.serviceData.latestGenerationId),
        with: {
          domains: true,
          ports: true,
          ulimits: true,
          sysctls: true,
          volumes: true,
        },
      });

    assert(
      this.serviceData.latestGeneration,
      "Service is missing latest generation!",
    );

    return this.serviceData.latestGeneration;
  }

  /**
   * Fetches the deployed generation of the service.
   * @param forceRefetch if true, will ignore what's cached internally
   */
  private async fetchDeployedGeneration(forceRefetch?: boolean) {
    if (!forceRefetch && this.serviceData.deployedGeneration) {
      return this.serviceData.deployedGeneration;
    }

    if (!this.serviceData.deployedGenerationId) return null;

    this.serviceData.deployedGeneration =
      await db.query.serviceGeneration.findFirst({
        where: eq(serviceGeneration.id, this.serviceData.deployedGenerationId),
        with: {
          domains: true,
          ports: true,
          ulimits: true,
          sysctls: true,
          volumes: true,
        },
      });

    assert(this.serviceData.deployedGeneration, "Could not find deployed gen");

    return this.serviceData.deployedGeneration;
  }

  /**
   * Refetches the latest data from the database.
   */
  private async refetch() {
    const data = await db.query.service.findFirst({
      where: eq(service.id, this.serviceData.id),
    });

    assert(data, "Could not find service in database");
    this.serviceData = data;
  }
}
