import assert from "assert";
import { eq } from "drizzle-orm";
import { mkdirSync, createReadStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import { db } from "../db";
import {
  serviceDeployment,
  serviceGeneration,
  service,
} from "../db/schema/schema";
import {
  ServiceBuildMethod,
  ServiceDeploymentStatus,
  ServiceSource,
} from "../db/types";
import Nixpacks from "./builders/Nixpacks";
import GitHubSource from "./sources/GitHub";
import BuilderLogger from "./utils/BuilderLogger";
import zlib from "node:zlib";
import type winston from "winston";
import mainLogger from "../utils/logger";
import type { GlobalStore } from "../managers/GlobalContext";
import Buildpacks from "./builders/Buildpacks";

export default class BuildTask {
  static BASE_BUILD_PATH = "/var/tmp";

  private readonly logFilePath: string;
  private readonly buildLogger: BuilderLogger;
  private readonly workingDirectory: string;
  private status = ServiceDeploymentStatus.BuildPending;

  // promise that resolves when the status is updated
  // prevents race conditions when updating the status
  private pendingStatusUpdatePromise: Promise<unknown> | null = null;

  // private logging
  private consoleLogger: winston.Logger;

  constructor(
    private readonly serviceId: string,
    private readonly deploymentId: string,
    private readonly finishCallback: (imageTag: string) => void,
    private readonly errorCallback: (error: unknown) => void,
    private readonly store: GlobalStore,
  ) {
    this.consoleLogger = mainLogger.child({
      module: "buildTask",
      deploymentId: this.deploymentId,
    });
    this.consoleLogger.debug(`Build dispatched for ${this.deploymentId}`);

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
          dockerImageTag = await new Nixpacks(
            configuration,
            this.store.docker,
          ).build();
          break;
        }

        case ServiceBuildMethod.Buildpacks: {
          dockerImageTag = await new Buildpacks(
            configuration,
            this.store.docker,
          ).build();
          break;
        }

        default: {
          throw new Error("Unknown build method");
        }
      }

      // aand we're done
      if (this.pendingStatusUpdatePromise) {
        await this.pendingStatusUpdatePromise;
      }

      // update status and save logs
      this.status = ServiceDeploymentStatus.Deploying;
      await (this.pendingStatusUpdatePromise = db
        .update(serviceDeployment)
        .set({
          status: ServiceDeploymentStatus.Deploying,
          buildLogs: await this.compressLogs(),
        })
        .where(eq(serviceDeployment.id, this.deploymentId)));

      this.finishCallback(dockerImageTag);
      return dockerImageTag;
    } catch (error) {
      // save logs
      await Promise.all([
        this.updateBuildStatus(ServiceDeploymentStatus.Failed),
        this.saveBuildLogs(),
      ]);

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
      rm(this.workingDirectory, { recursive: true }),
      rm(this.logFilePath),
    ]);
  }

  public getLogFile() {
    return this.logFilePath;
  }

  private async fetchServiceDetails() {
    const [serviceDetails] = await db
      .select({
        latestGeneration: serviceGeneration,
      })
      .from(service)
      .innerJoin(
        serviceGeneration,
        eq(serviceGeneration.id, service.latestGenerationId),
      )
      .where(eq(service.id, this.serviceId));

    assert(serviceDetails, "Service not found");

    return serviceDetails.latestGeneration;
  }

  private async updateBuildStatus(status: ServiceDeploymentStatus) {
    if (this.pendingStatusUpdatePromise) {
      await this.pendingStatusUpdatePromise;
    }

    this.status = status;

    // in the event that the service is deleted while building, it'll probably error here
    // but doesn't really matter
    await (this.pendingStatusUpdatePromise = db
      .update(serviceDeployment)
      .set({ status })
      .where(eq(serviceDeployment.id, this.deploymentId)));
  }

  private compressLogs(): Promise<Buffer> {
    // pipe through read stream to reduce memory usage
    // only load the compressed data into memory
    const compressedLogs = zlib.createBrotliCompress();
    const readStream = createReadStream(this.logFilePath);

    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      readStream.pipe(compressedLogs);

      compressedLogs.on("data", (data: Buffer) => buffers.push(data));

      compressedLogs.on("error", reject);
      compressedLogs.on("end", () => resolve(Buffer.concat(buffers)));
    });
  }

  private async saveBuildLogs() {
    const logs = await this.compressLogs();
    await db
      .update(serviceDeployment)
      .set({ buildLogs: logs })
      .where(eq(serviceDeployment.id, this.deploymentId));
  }
}
