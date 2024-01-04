"use server";

import {
  TRPCClientError,
  createTRPCClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";

import { TRPCError } from "@trpc/server";
import chalk from "chalk";
import { cookies, headers } from "next/headers";
import { type AppRouter } from "~/server/api/root";
import logger from "~/server/utils/logger";
import { getUrl, transformer } from "./shared";

export const api = createTRPCClient<AppRouter>({
  transformer,
  links: [
    loggerLink({
      logger: (data) => {
        const log = logger.child({
          module: "trpc",
          type: data.type,
          path: data.path,
          direction: data.direction,
        });

        // dont log incoming requests
        if (data.direction === "up") return;

        // log errors
        if (data.result instanceof Error || data.result instanceof TRPCError) {
          // 4xx errors should not be logged as an error
          if (data.result instanceof TRPCClientError) {
            // this is used to check if the user is logged in, so we dont want to log it
            if (
              data.result.data?.httpStatus === 401 &&
              data.path === "auth.me"
            ) {
              return;
            }

            // if is a client error, just debug log it
            if (data.result.data?.httpStatus === 400) {
              log.debug(`${data.result.data?.httpStatus}: ${data.path}`, {
                error: data.result,
                context: data.context,
              });

              return;
            }
          }

          log.error(`Error occured on ${chalk.red(data.path)}`, {
            error: data.result,
          });

          return;
        }

        if (data.elapsedMs > 250) {
          log.warn(
            `📤 Request to ${chalk.green(data.path)} completed in ${chalk.red(
              data.elapsedMs + "ms",
            )}`,
          );
        } else {
          log.debug(
            `📤 Request to ${chalk.green(data.path)} completed in ${
              data.elapsedMs
            }ms`,
          );
        }
      },
    }),
    unstable_httpBatchStreamLink({
      url: getUrl(),
      headers() {
        const heads = headers();
        const cooks = cookies();

        return {
          cookie: cooks.toString(),
          "x-trpc-source": "rsc",
          "X-Forwarded-For": heads.get("X-Forwarded-For") ?? undefined,
        };
      },
    }),
  ],
});
