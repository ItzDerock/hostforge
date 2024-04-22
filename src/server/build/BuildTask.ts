import assert from "assert";
import { eq } from "drizzle-orm";
import { mkdirSync } from "fs";
import { rm, rmdir } from "fs/promises";
import path from "path";
import { db } from "../db";
import { service, serviceDeployment } from "../db/schema";
import {
  ServiceBuildMethod,
  ServiceDeploymentStatus,
  ServiceSource,
} from "../db/types";
import Nixpacks from "./builders/Nixpacks";
import GitHubSource from "./sources/GitHub";
import BuilderLogger from "./utils/BuilderLogger";

export default class BuildTask {
  static BASE_BUILD_PATH = "/var/tmp";

  private readonly logFilePath: string;
  private readonly buildLogger: BuilderLogger;
  private readonly workingDirectory: string;
  private status = ServiceDeploymentStatus.BuildPending;

  // promise that resolves when the status is updated
  // prevents race conditions when updating the status
  private pendingStatusUpdatePromise: Promise<unknown> | null = null;

  constructor(
    private readonly serviceId: string,
    private readonly deploymentId: string,
    private readonly finishCallback: (imageTag: string) => void,
    private readonly errorCallback: (error: unknown) => void,
  ) {
    this.workingDirectory = path.join(
      BuildTask.BASE_BUILD_PATH,
      "hostforgebuild-" + this.deploymentId,
    );

    this.logFilePath = path.join(
      BuildTask.BASE_BUILD_PATH,
      "hostforgebuild-" + this.deploymentId + ".log",
    );

    // create the logger and make directories
    this.buildLogger = new BuilderLogger(this.logFilePath);
    mkdirSync(this.workingDirectory, { recursive: true });

    // set the status
    void this.updateBuildStatus(this.status);
  }

  public async build() {
    try {
      void this.updateBuildStatus(ServiceDeploymentStatus.Building);

      // get the service details
      const serviceDetails = await this.fetchServiceDetails();
      const configuration = {
        fileLogger: this.buildLogger,
        workDirectory: this.workingDirectory,
        serviceConfiguration: serviceDetails,
      };

      // pull the code
      switch (serviceDetails.source) {
        case ServiceSource.GitHub: {
          await new GitHubSource(configuration).downloadCode();

          break;
        }

        default: {
          throw new Error("Unknown source");
        }
      }

      let dockerImageTag = this.deploymentId;

      // build the project
      switch (serviceDetails.buildMethod) {
        case ServiceBuildMethod.Nixpacks: {
          dockerImageTag = await new Nixpacks(configuration).build();

          break;
        }

        default: {
          throw new Error("Unknown build method");
        }
      }

      // aand we're done
      void this.updateBuildStatus(ServiceDeploymentStatus.Deploying);
      this.finishCallback(dockerImageTag);
      return dockerImageTag;
    } catch (error) {
      void this.updateBuildStatus(ServiceDeploymentStatus.Failed);
      this.errorCallback(error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Cleans up all the files created by the build task.
   *
   * ENSURE THAT THIS FUNCTION IS CALLED WHEN THE BUILD TASK IS DONE
   * EVEN IF THE BUILD TASK FAILS
   */
  public async cleanup() {
    // need to wait for fd to close before deleting the log file
    await this.buildLogger.finish();

    await Promise.allSettled([
      rmdir(this.workingDirectory, { recursive: true }),
      rm(this.logFilePath),
    ]);
  }

  private async fetchServiceDetails() {
    const [serviceDetails] = await db
      .select()
      .from(service)
      .where(eq(service.id, this.serviceId));

    assert(serviceDetails, "Service not found");

    return serviceDetails;
  }

  private async updateBuildStatus(status: ServiceDeploymentStatus) {
    if (this.pendingStatusUpdatePromise) {
      await this.pendingStatusUpdatePromise;
    }

    // in the event that the service is deleted while building, it'll probably error here
    // but doesn't really matter
    await (this.pendingStatusUpdatePromise = db
      .update(serviceDeployment)
      .set({ status })
      .where(eq(serviceDeployment.id, this.deploymentId)));

    this.status = status;
  }
}
