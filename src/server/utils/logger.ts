import { createLogger, format, transports } from "winston";
import chalk from "chalk";

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

        format.printf(({ level, message, timestamp, module }) => {
          return `${timestamp} ${level} ${chalk.cyan(
            (module ?? "main") + ":",
          )} ${message}`;
        }),
      ),

      level: "debug",
    }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

export default logger;
