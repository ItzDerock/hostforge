"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HTTPBatchStreamLinkOptions,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import { type AppRouter } from "~/server/api/root";
import { getUrl, transformer } from "./shared";
import { authLink } from "./auth";

export const api = createTRPCReact<AppRouter>();

const sharedLinkOptions = (cookies: string) =>
  ({
    url: getUrl(),
    headers() {
      return {
        cookie: cookies,
        "x-trpc-source": "react",
      };
    },

    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  }) satisfies HTTPBatchStreamLinkOptions;

export function TRPCReactProvider(props: {
  children: React.ReactNode;
  cookies: string;
}) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        authLink(sharedLinkOptions(props.cookies)),
        unstable_httpBatchStreamLink(sharedLinkOptions(props.cookies)),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
