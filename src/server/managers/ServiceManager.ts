import { deterministicString } from "deterministic-object-hash";
import { and, eq, or } from "drizzle-orm";
import { create } from "jsondiffpatch";
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
}
