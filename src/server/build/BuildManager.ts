import assert from "assert";
import { Queue } from "datastructures-js";
import { db } from "../db";
import { serviceDeployment } from "../db/schema";
import { ServiceDeploymentStatus, ServiceSource } from "../db/types";
import { type Service } from "../docker/stack";
import logger from "../utils/logger";
import BuildTask from "./BuildTask";

export class BuildManager {
  private static logger = logger.child({ module: "builds" });
  private static instance = new BuildManager();

  public static getInstance() {
    return BuildManager.instance;
  }

  // CONFIGURATION --------
  public readonly MAX_CONCURRENT_BUILDS = 5; // TODO: make this configurable

  // STATE --------
  private tasks = new Map<string, BuildTask>();
  private queue = new Queue<string>();
  private ongoingTasks = new Set<string>();
  private processing = false;

  // METHODS --------
  public startBuild(serviceId: string, deploymentId: string) {
    return new Promise<string>((resolve, reject) => {
      const task = new BuildTask(serviceId, deploymentId, resolve, reject);
      this.tasks.set(deploymentId, task);
      this.queue.enqueue(deploymentId);

      this.processQueue();
    });
  }

  public async runBuilds(services: Service[]) {
    await Promise.all(
      services.map(async (service) => {
        if (service.source !== ServiceSource.Docker) {
          const [deployment] = await db
            .insert(serviceDeployment)
            .values({
              serviceId: service.id,
              status: ServiceDeploymentStatus.BuildPending,
            })
            .returning()
            .execute();

          assert(deployment);

          service.finalizedDockerImage =
            await BuildManager.getInstance().startBuild(
              service.id,
              deployment.id,
            );
        }
      }),
    );
  }

  private async processNext() {
    if (this.queue.isEmpty()) {
      BuildManager.logger.debug("Queue is empty");
      return;
    }

    const deploymentId = this.queue.dequeue();
    const task = this.tasks.get(deploymentId);

    if (!task) {
      BuildManager.logger.warn(`Task not found: ${deploymentId}`);
      return;
    }

    BuildManager.logger.info(`Processing task: ${deploymentId}`);

    try {
      await task.build();
    } catch (error) {
      BuildManager.logger.error(error);
    } finally {
      this.tasks.delete(deploymentId);
      this.ongoingTasks.delete(deploymentId);
    }

    this.processQueue();
  }

  private processQueue() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (
      !this.queue.isEmpty() &&
      this.ongoingTasks.size < this.MAX_CONCURRENT_BUILDS
    ) {
      const deploymentId = this.queue.front();
      this.ongoingTasks.add(deploymentId);

      void this.processNext().catch((err) => {
        BuildManager.logger.error("Failed to process task " + deploymentId);
        BuildManager.logger.error(err);
      });
    }

    this.processing = false;
  }
}
