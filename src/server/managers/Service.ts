import { deterministicString } from "deterministic-object-hash";
import { and, eq, or } from "drizzle-orm";
import { create } from "jsondiffpatch";
import assert from "node:assert";
import { db } from "../db";
import { service, serviceGeneration } from "../db/schema";
import { ServiceSource } from "../db/types";
import logger from "../utils/logger";

export default class ServiceManager {
  private static LOGGER = logger.child({
    module: "ServiceManager",
  });

  private static JSON_DIFF = create({
    objectHash: (obj: unknown) => {
      if (typeof obj !== "object" || obj === null) {
        return deterministicString(obj);
      }

      if ("id" in obj && typeof obj.id === "string") {
        return obj.id;
      }

      this.LOGGER.warn("Unexpected object in JSON diff.", { obj });
      return deterministicString(obj);
    },
  });

  constructor(
    private serviceData: typeof service.$inferSelect & {
      latestGeneration?: typeof serviceGeneration.$inferSelect;
      deployedGeneration?: typeof serviceGeneration.$inferSelect;
    },
  ) {}

  /**
   * Finds a service by name or ID.
   */
  static async findByNameOrId(nameOrId: string, projectId: string) {
    const data = await db.query.service.findFirst({
      where: and(
        eq(service.projectId, projectId),
        or(eq(service.name, nameOrId), eq(service.id, nameOrId)),
      ),
    });

    return data ? new ServiceManager(data) : null;
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
      return {};
    }

    // fetch the generations
    const [latest, deployed] = await Promise.all([
      this.fetchLatestGeneration(),
      this.fetchDeployedGeneration(),
    ]);

    // compare the two
    return ServiceManager.JSON_DIFF.diff(deployed, latest);
  }

  /**
   * Returns true if there has been a configuration change
   */
  public async hasPendingChanges() {
    const diff = await this.buildDeployDiff();

    if (typeof diff === "object") return Object.keys(diff).length !== 0;
    return true;
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
   * Clones the latest generation and sets the original generation as the deployed generation.
   */
  public async deriveNewGeneration(setDeploymentId?: string) {
    // do as much as possible on the database
    await db.transaction(async (trx) => {
      // clone the latest generation
      const originalLatestGeneration =
        await trx.query.serviceGeneration.findFirst({
          where: eq(serviceGeneration.id, this.serviceData.latestGenerationId),
        });

      assert(originalLatestGeneration, "Could not find latest generation??");

      // update deployment id
      originalLatestGeneration.deploymentId = setDeploymentId ?? null;

      // delete the ID so we can insert it again
      // @ts-expect-error i dont feel like typing it as optional
      delete originalLatestGeneration.id;

      // insert the cloned generation
      const [clonedLatestGeneration] = await trx
        .insert(serviceGeneration)
        .values(originalLatestGeneration)
        .returning({ id: serviceGeneration.id });

      assert(clonedLatestGeneration, "Cloned generation was null!");

      // update the service's latest gen to point to the cloned generation
      // and set the deployed gen to the original
      await trx.update(service).set({
        latestGenerationId: clonedLatestGeneration.id,
        deployedGenerationId: this.serviceData.latestGenerationId,
      });
    });

    await this.refetch();
  }

  public async fetchFullLatestGeneration() {
    return await db.query.serviceGeneration.findFirst({
      where: eq(serviceGeneration.id, this.serviceData.latestGenerationId),
      with: {
        deployment: true,
        domains: true,
        ports: true,
        service: true,
        sysctls: true,
        ulimits: true,
        volumes: true,
      },
    });
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

    this.serviceData.deployedGeneration =
      await db.query.serviceGeneration.findFirst({
        where: eq(serviceGeneration.id, this.serviceData.deployedGenerationId),
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