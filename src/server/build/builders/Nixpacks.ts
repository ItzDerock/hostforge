import { LogLevel } from "../utils/BuilderLogger";
import { joinPathLimited } from "../utils/utils";
import BaseBuilder from "./BaseBuilder";
import { parse } from "dotenv";

export default class Nixpacks extends BaseBuilder {
  private static readonly NIXPACKS_VERSION = "1.24.1";

  public async build(): Promise<string> {
    await this.startBuildContainer();

    this.configuration.fileLogger.write(
      LogLevel.Notice,
      "> Building the service with Nixpacks.",
    );

    // join the build path with the work directory
    const buildPath = joinPathLimited(
      this.configuration.workDirectory,
      this.configuration.serviceConfiguration.buildPath,
    );

    const env = parse(this.configuration.serviceConfiguration.environment);
    const envFlags = Object.entries(env).flatMap(([key, value]) => [
      "--env",
      `${key}=${value}`,
    ]);

    // set up nixpacks
    await this.execInContainer([
      "curl",
      "-L",
      "-o",
      "/tmp/nixpacks.deb",
      `https://github.com/railwayapp/nixpacks/releases/download/v${Nixpacks.NIXPACKS_VERSION}/nixpacks-v${Nixpacks.NIXPACKS_VERSION}-amd64.deb`,
    ]);

    await this.execInContainer(["dpkg", "-i", "/tmp/nixpacks.deb"]);

    await this.execInContainer([
      "nixpacks",
      "build",
      buildPath,
      "--name",
      this.configuration.serviceConfiguration.id,
      ...envFlags,
    ]);

    // return the docker tag
    return this.configuration.serviceConfiguration.id;
  }
}
