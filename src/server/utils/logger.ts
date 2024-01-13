import chalk from "chalk";
import util from "node:util";
import { createLogger, format, transports } from "winston";

const SPLAT = Symbol.for("splat");

const logger = createLogger({
  transports: [
    new transports.Console({
      // HH:MM:SS.mmm level hostforge.<module>: message
      format: format.combine(
        format.colorize(),
        format.timestamp({
          format() {
            return chalk.gray(new Date().toISOString().split("T")[1]);
          },
        }),

        format.printf(({ level, message, timestamp, module, ...others }) => {
          const base = `${timestamp} ${level} ${chalk.cyan(
            (module ?? "main") + ":",
          )} ${message}`;

          if (others[SPLAT]) {
            const splat = others[SPLAT] as unknown[];
            if (splat.length > 0) {
              return base + " " + splat.map((s) => util.inspect(s)).join("\n");
            }
          }

          return base;
        }),

        format.metadata({}),
      ),

      level: "debug",
    }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

export default logger;
