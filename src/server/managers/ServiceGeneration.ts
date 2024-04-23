import { eq } from "drizzle-orm";
import { db } from "../db";
import { serviceGeneration } from "../db/schema";

export default class ServiceGeneration {
  constructor(
    private readonly generationData: typeof serviceGeneration.$inferSelect,
  ) {}

  /**
   * Returns the data for this generation.
   */
  public getData() {
    return this.generationData;
  }

  /**
   * Sets the deployment ID for this generation
   */
  public async setDeploymentId(deploymentId: string) {
    this.generationData.deploymentId = deploymentId;
    await db
      .update(serviceGeneration)
      .set({
        deploymentId,
      })
      .where(eq(serviceGeneration.id, this.generationData.id));
  }
}
