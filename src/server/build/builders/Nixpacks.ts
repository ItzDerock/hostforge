import { spawn } from "child_process";
import { LogLevel } from "../utils/BuilderLogger";
import { joinPathLimited, waitForExit } from "../utils/utils";
import BaseBuilder from "./BaseBuilder";

export default class Nixpacks extends BaseBuilder {
  public async build(): Promise<string> {
    this.configuration.fileLogger.write(
      LogLevel.Notice,
      "> Building the service with Nixpacks.",
    );

    // join the build path with the work directory
    const buildPath = joinPathLimited(
      this.configuration.workDirectory,
      this.configuration.serviceConfiguration.buildPath,
    );

    const nixpacks = spawn("nixpacks", [
      "build",
      buildPath,
      "--name",
      this.configuration.serviceConfiguration.id,
    ]);

    // pipe output
    this.configuration.fileLogger.withChildprocess(nixpacks);

    // wait for exit
    await waitForExit(nixpacks);

    // return the docker tag
    return this.configuration.serviceConfiguration.id;
  }
}
