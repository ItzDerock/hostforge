import { type ChildProcessWithoutNullStreams } from "child_process";
import { createWriteStream, type WriteStream } from "fs";
import { Transform } from "node:stream";

export enum LogLevel {
  /**
   * Command Stdout
   */
  Stdout,

  /**
   * Command Stderr
   */
  Stderr,

  /**
   * Messages that did not originate from the command
   */
  Notice,
}

/**
 * A very simple file logger to log the output of the build process.
 */
export default class BuilderLogger {
  private logFileStream: WriteStream;

  constructor(public readonly logFilePath: string) {
    this.logFileStream = createWriteStream(this.logFilePath, {
      flags: "a",
    });
  }

  public write(level: LogLevel, message: string) {
    return this.logFileStream.write(this.formatMessage(level, message), "utf8");
  }

  public asWriteStream(level: LogLevel) {
    return new Transform({
      transform: (chunk, encoding, callback) => {
        this.write(level, String(chunk));
        callback();
      },
    });
  }

  public withChildprocess(cp: ChildProcessWithoutNullStreams) {
    cp.stdout.pipe(this.asWriteStream(LogLevel.Stdout));
    cp.stderr.pipe(this.asWriteStream(LogLevel.Stderr));
  }

  public finish() {
    return new Promise<void>((resolve, reject) => {
      this.logFileStream.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private formatMessage(level: LogLevel, message: string) {
    return JSON.stringify({ l: level, m: message, t: Date.now() }) + "\n";
  }
}
