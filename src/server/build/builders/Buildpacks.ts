import { spawn } from "child_process";
import { LogLevel } from "../utils/BuilderLogger";
import { joinPathLimited, waitForExit } from "../utils/utils";
import BaseBuilder from "./BaseBuilder";
import { parse } from "dotenv";

export default class Buildpacks extends BaseBuilder {
  public async build(type = "heroku/builder:22"): Promise<string> {
    this.configuration.fileLogger.write(
      LogLevel.Notice,
      "> Building the service with Buildpacks.",
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

    const buildpacks = spawn(
      "pack",
      [
        "build",
        this.dockerTag,
        "--path",
        buildPath,
        ...envFlags,
        "--builder",
        type,
      ],
      {
        env: {
          ...process.env, // a bit dangerous, but nothing in env should be sensitive
          DATABASE_PATH: undefined,
          PORT: undefined,
        },
      },
    );

    // pipe output
    this.configuration.fileLogger.withChildprocess(buildpacks);

    // wait for exit
    await waitForExit(buildpacks);

    // return the docker tag
    return this.push();
  }
}
