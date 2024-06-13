import { spawn } from "child_process";
import { LogLevel } from "../utils/BuilderLogger";
import { waitForExit } from "../utils/utils";
import BaseBuilder from "./BaseBuilder";
import { parse } from "dotenv";

export default class Dockerfile extends BaseBuilder {
  public async build(): Promise<string> {
    this.configuration.fileLogger.write(
      LogLevel.Notice,
      "> Building the service using Dockerfile.",
    );

    const env = parse(this.configuration.serviceConfiguration.environment);
    const envFlags = Object.entries(env).flatMap(([key, value]) => [
      "--build-arg",
      `${key}=${value}`,
    ]);

    const docker = spawn(
      "docker",
      [
        "build",
        "-t",
        this.dockerTag,
        this.configuration.serviceConfiguration.buildPath,
        ...envFlags,
      ],
      {
        env: {
          ...process.env, // a bit dangerous, but nothing in env should be sensitive
          DATABASE_PATH: undefined,
          PORT: undefined,
        },
        cwd: this.configuration.workDirectory,
      },
    );

    // pipe output
    this.configuration.fileLogger.withChildprocess(docker);

    // wait for exit
    await waitForExit(docker);

    // return the docker tag
    return await this.push();
  }
}
