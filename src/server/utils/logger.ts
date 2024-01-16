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
              const formattedSplat = splat
                .map((s) => util.inspect(s, { colors: true, showHidden: true }))
                .flatMap((s) => s.split("\n"))
                .map((s) => `    ${s}`)
                .join("\n");

              return base + "\n" + formattedSplat;
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
