// import { dockerCommand } from "docker-cli-js";
import { spawn } from "child_process";
import Dockerode from "dockerode";
import logger from "../utils/logger";
import { PassThrough, Transform } from "stream";
import { LogLevel } from "../build/utils/BuilderLogger";

export class Docker extends Dockerode {
  static buildContainerPrefixFromName(
    projectName: string,
    serviceName: string,
  ) {
    return `${projectName}_${serviceName}`;
  }

  /**
   * An improved version of docker-modem's demuxStream
   * as that one has race conditions since it doesn't wait for writes to finish
   * and writes to separate streams
   */
  static demuxStream() {
    return new Transform({
      transform(chunk: Buffer, encoding: unknown, callback: () => void) {
        if (chunk.length < 8) {
          this.push(chunk);
          callback();
          return;
        }

        const header = chunk.subarray(0, 8);
        const dataType = header.readUint8(0);
        const dataLength = header.readUint32BE(4);

        if (chunk.length < dataLength + 8) {
          this.push(chunk);
          callback();
          return;
        }

        const content = chunk
          .subarray(8, dataLength + 8)
          .toString()
          .split(" ");
        const timestamp = new Date(content.shift() ?? "");
        const message = content.join(" ");

        this.push(
          JSON.stringify({
            t: timestamp.getTime(),
            m: message,
            l: dataType === 1 ? LogLevel.Stdout : LogLevel.Stderr,
          }),
        );

        callback();
      },
    });
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
