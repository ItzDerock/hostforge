import { experimental_standaloneMiddleware } from "@trpc/server";
import chalk from "chalk";
import logger from "~/server/utils/logger";

const log = logger.child({ module: "trpc:server" });
export const loggerMiddleware = experimental_standaloneMiddleware().create(
  async ({ type, path, next }) => {
    const result = await next();

    if (result.ok === false) {
      if (result.error.code === "INTERNAL_SERVER_ERROR") {
        log.error(
          `Internal server error on ${chalk.red(type)}: ${chalk.red(path)}`,
          result.error,
        );
      } else {
        log.warn(
          `${result.error.code} on ${chalk.yellow(type)}: ${chalk.yellow(
            path,
          )}`,
          result.error.message,
        );
      }
    }

    return result;
  },
);
