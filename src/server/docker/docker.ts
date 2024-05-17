// import { dockerCommand } from "docker-cli-js";
import { spawn } from "child_process";
import Dockerode from "dockerode";
import logger from "../utils/logger";

export class Docker extends Dockerode {
  static buildContainerPrefixFromName(
    projectName: string,
    serviceName: string,
  ) {
    return `${projectName}_${serviceName}`;
  }

  private log = logger.child({ module: "docker" });

  /**
   * Runs a docker command.
   *
   * @param command
   * @param args
   */
  public cli(
    args: string[],
    opts: {
      cwd?: string;
      stdin?: string;
    } = {},
  ): Promise<string> {
    this.log.debug(
      `Running: docker ${args.map((arg) => `"${arg}"`).join(" ")}`,
    );
    const cmd = spawn("docker", args, {
      cwd: opts.cwd,
    });

    if (opts.stdin) {
      cmd.stdin.setDefaultEncoding("utf-8");
      cmd.stdin.write(opts.stdin, (err) => {
        if (err) throw err;
        cmd.stdin.end();

        this.log.debug("Wrote stdin to docker command: ", opts.stdin);
      });
    }

    return new Promise((resolve, reject) => {
      let output = "";

      cmd.stdout.on("data", (chunk) => {
        if (chunk instanceof Buffer) output += chunk.toString("utf-8");
        else if (typeof chunk === "string") output += chunk;
        else this.log.warn("Recieved stdout of unknown type: ", chunk);
      });

      cmd.stderr.on("data", (chunk) => {
        if (chunk instanceof Buffer) output += chunk.toString("utf-8");
        else if (typeof chunk === "string") output += chunk;
        else this.log.warn("Recieved stderr of unknown type: ", chunk);
      });

      cmd.on("exit", (code) => {
        if (code != 0) {
          this.log.warn(
            "Docker command failed with status code ",
            code,
            output,
          );

          reject(
            Object.assign(
              new Error("Docker command failed with status code " + code),
              { output, code },
            ),
          );

          return;
        }

        resolve(output);
      });
    });
  }
}
