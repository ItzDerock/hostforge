import { Docker } from "~/server/docker/docker";
import { type serviceGeneration } from "../../db/schema/schema";
import type BuilderLogger from "../utils/BuilderLogger";
import { LogLevel } from "../utils/BuilderLogger";
import type Dockerode from "dockerode";
import { DockerNetworks } from "~/server/docker";
import assert from "assert";

export default class BaseBuilder {
  private static readonly DEFAULT_BASE_IMAGE = "debian:12.5";
  protected container: Dockerode.Container | undefined;
  protected dockerImageTag: string;

  constructor(
    public readonly configuration: {
      fileLogger: BuilderLogger;
      workDirectory: string;
      serviceConfiguration: typeof serviceGeneration.$inferSelect;
    },

    protected readonly docker: Docker,
  ) {
    const { id, serviceId } = this.configuration.serviceConfiguration;
    this.dockerImageTag = `hostforge_internal_registry/${serviceId}:${id}`;
  }

  /**
   * Builds the service, returning the docker tag.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async build(): Promise<string> {
    throw new Error("Not implemented");
  }

  public async cleanup() {
    if (this.container) {
      await this.container.stop();
      await this.container.remove();
    }
  }

  protected async startBuildContainer(
    baseImage: string = BaseBuilder.DEFAULT_BASE_IMAGE,
  ) {
    this.configuration.fileLogger.write(
      LogLevel.Notice,
      `Starting build container with base image "${baseImage}"`,
    );

    const container = (this.container = await this.docker.createContainer({
      Image: baseImage,
      Cmd: ["sleep", "infinity"],
      Labels: {
        "sh.hostforge.builder": "true",
        "sh.hostforge.service_id":
          this.configuration.serviceConfiguration.serviceId,
      },
    }));

    await container.start();

    return { container };
  }

  protected async execInContainer(
    args: string[],
    options: Dockerode.ExecStartOptions = {},
  ) {
    if (!this.container) {
      throw new Error("Container not started");
    }

    const exec = await this.container.exec({
      Cmd: args,
      AttachStdout: true,
      AttachStderr: true,
      ...options,
    });

    const stream = (await exec.start({})).pipe(Docker.demuxStream());

    // on data, write to the file logger
    stream.on("data", (data: { t: LogLevel; m: string }) => {
      this.configuration.fileLogger.write(data.t, data.m);
    });

    // wait for exit
    await new Promise<void>((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });
  }

  protected async pushImageToRegistry() {
    assert(this.container, "Container not started");

    // attach to registry network
    await this.docker.getNetwork(DockerNetworks.Registry).connect({
      Container: this.container.id,
    });

    // and upload the image
    await this.execInContainer(["docker", "push", this.dockerImageTag]);
  }
}
