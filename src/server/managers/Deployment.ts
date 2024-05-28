import assert from "assert";
import { BuildManager } from "../build/BuildManager";
import { db } from "../db";
import { serviceDeployment } from "../db/schema";
import { ServiceDeploymentStatus } from "../db/types";
import ServiceManager from "./Service";
import { Duplex, PassThrough, type Readable } from "stream";
import baseLogger from "../utils/logger";
import type winston from "winston";
import { waitForFileToExist } from "../utils/file";
import { createReadStream } from "fs";
import { brotliDecompress } from "zlib";
import { promisify } from "util";

const brotliDecompressAsync = promisify(brotliDecompress);

export default class Deployment {
  private logger: winston.Logger;

  constructor(
    private deploymentData: Omit<
      typeof serviceDeployment.$inferSelect,
      "buildLogs"
    >,
    private serviceData: ServiceManager,
  ) {
    this.logger = baseLogger.child({
      module: "deployment",
      deploymentId: deploymentData.id,
    });
  }

  get data() {
    return this.deploymentData;
  }

  get service() {
    return this.serviceData;
  }

  /**
   * Streams the build logs for this deployment.
   * TODO: possibly cache this globally, so we're not reading the buffer multiple times
   */
  readBuildLogs(signal: AbortSignal): Readable {
    const returnStream = new PassThrough();

    // streaming done in the background
    void (async () => {
      // if deployment is in-progress, tail the log file
      // if its pending, wait for the file to be created
      if (
        this.deploymentData.status == ServiceDeploymentStatus.Building ||
        this.deploymentData.status == ServiceDeploymentStatus.BuildPending
      ) {
        const task = BuildManager.getInstance().getTask(this.deploymentData.id);
        if (!task) {
          this.logger.error("Task not found for deployment");
          returnStream.destroy(new Error("Task not found for deployment"));
          return;
        }

        const filepath = task.getLogFile();

        // wait for it to exist
        await waitForFileToExist(filepath, signal);
        signal.throwIfAborted();

        // stream the file
        const fileStream = createReadStream(filepath);
        fileStream.pipe(returnStream);

        signal.addEventListener("abort", () => {
          fileStream.close();
          returnStream.end();
        });

        return;
      }

      // fetch and decompress
      const buildLogs = await db.query.serviceDeployment.findFirst({
        where: (tbl, { eq }) => eq(tbl.id, this.deploymentData.id),
        columns: {
          buildLogs: true,
        },
      });

      if (buildLogs?.buildLogs === undefined) {
        this.logger.warn("No build logs found for deployment");
        returnStream.end();
        return;
      }

      signal.throwIfAborted();

      if (!buildLogs.buildLogs) {
        returnStream.end();
        return;
      }

      // decompress with zlib
      assert(
        buildLogs.buildLogs instanceof Buffer,
        `expected buildLogs to be a buffer, recieved ${typeof buildLogs.buildLogs}`,
      );

      const data = await brotliDecompressAsync(buildLogs.buildLogs);
      returnStream.push(data);
      returnStream.end();
    })()
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") {
          this.logger.debug(
            "Streaming stopped due to user abort: ",
            err.message,
          );

          return;
        }

        this.logger.error("Streaming error:", err);
        returnStream.destroy(err);
      })
      .then(() => {
        returnStream.end();
      });

    return returnStream;
  }
}
