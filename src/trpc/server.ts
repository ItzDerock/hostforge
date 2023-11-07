import {
  createTRPCProxyClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";

import { type AppRouter } from "~/server/api/root";
import { getUrl, transformer } from "./shared";
import { cookies, headers } from "next/headers";

export const api = createTRPCProxyClient<AppRouter>({
  transformer,
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
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
