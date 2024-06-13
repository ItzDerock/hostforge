import type { Docker } from "~/server/docker/docker";
import { type serviceGeneration } from "../../db/schema/schema";
import type BuilderLogger from "../utils/BuilderLogger";
// import { DockerInternalServices } from "~/server/docker";

export default class BaseBuilder {
  protected readonly dockerTag: string;

  constructor(
    public readonly configuration: {
      fileLogger: BuilderLogger;
      workDirectory: string;
      serviceConfiguration: typeof serviceGeneration.$inferSelect;
    },

    protected readonly docker: Docker,
  ) {
    this.dockerTag = `${this.configuration.serviceConfiguration.serviceId}:${this.configuration.serviceConfiguration.id}`;
  }

  /**
   * Builds the service, returning the docker tag.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async build(): Promise<string> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async push(tag = this.dockerTag): Promise<string> {
    await this.docker.getImage(tag).tag({
      repo: this.configuration.serviceConfiguration.serviceId,
      tag: "latest",
    });

    return `${this.configuration.serviceConfiguration.serviceId}:latest`;

    // tag the image as `{registry}/{service}:{generation}`
    // const registryHost = await this.docker.getIpOrHostname(
    //   DockerInternalServices.Registry,
    // );
    // const { id, serviceId } = this.configuration.serviceConfiguration;
    // // const newTag = `${registryHost}/${serviceId}:${id}`;
    // const repo = `${registryHost}/${serviceId}`;
    // const newTag = id;

    // // tag the image
    // await this.docker.getImage(tag).tag({
    //   repo,
    //   tag: newTag,
    // });

    // await this.docker.getImage(`${repo}:${newTag}`).push();

    // // remove the image
    // await this.docker.getImage(tag).remove();

    // // return the new tag
    // return `${DockerInternalServices.Registry}:${tag}`;
  }
}
