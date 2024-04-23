import { deterministicString } from "deterministic-object-hash";
import { and, eq, or } from "drizzle-orm";
import { create } from "jsondiffpatch";
import assert from "node:assert";
import { db } from "../db";
import { service, serviceGeneration } from "../db/schema";
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
   * Clones the latest generation and sets the original generation as the deployed generation.
   */
  public async deriveNewGeneration() {
    // do as much as possible on the database
    await db.transaction(async (trx) => {
      // clone the latest generation
      const originalLatestGeneration =
        await trx.query.serviceGeneration.findFirst({
          where: eq(serviceGeneration.id, this.serviceData.latestGenerationId),
        });

      assert(originalLatestGeneration, "Could not find latest generation??");

      // delete the ID so we can insert it again
      originalLatestGeneration.deploymentId = null;
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

  /**
   * Fetches the latest generation of the service.
   * @param forceRefetch if true, will ignore what's cached internally
   * @returns
   */
  private async fetchLatestGeneration(forceRefetch?: boolean) {
    if (!forceRefetch && this.serviceData.latestGeneration) {
      return this.serviceData.latestGeneration;
    }

    return (this.serviceData.latestGeneration =
      await db.query.serviceGeneration.findFirst({
        where: eq(serviceGeneration.id, this.serviceData.latestGenerationId),
      }));
  }

  /**
   * Fetches the deployed generation of the service.
   * @param forceRefetch if true, will ignore what's cached internally
   */
  private async fetchDeployedGeneration(forceRefetch?: boolean) {
    if (!forceRefetch && this.serviceData.deployedGeneration) {
      return this.serviceData.deployedGeneration;
    }

    return (this.serviceData.deployedGeneration =
      await db.query.serviceGeneration.findFirst({
        where: eq(serviceGeneration.id, this.serviceData.deployedGenerationId),
      }));
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
