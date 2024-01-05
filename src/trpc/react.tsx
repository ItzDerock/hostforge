"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  TRPCClientError,
  createWSClient,
  loggerLink,
  splitLink,
  unstable_httpBatchStreamLink,
  wsLink,
  type HTTPBatchStreamLinkOptions,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { type AppRouter } from "~/server/api/root";
import { authLink, toastLink } from "./links";
import { getUrl, transformer } from "./shared";

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
  const router = useRouter();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (!(error instanceof TRPCClientError)) return false;

              // check if is an unauthorized error
              if (
                error.cause &&
                error.cause.message === "User is not logged in."
              ) {
                router.push("/login");
                return false;
              }

              // retry 3 times, then give up
              return failureCount < 3;
            },
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),

        toastLink,
        authLink(sharedLinkOptions(props.cookies)),

        splitLink({
          condition(op) {
            return op.type === "subscription";
          },

          true: wsLink({
            client: createWSClient({
              url: getUrl().replace("http", "ws"),
              lazy: {
                enabled: true,
                closeMs: 5_000,
              },
            }),
          }),

          false: unstable_httpBatchStreamLink(sharedLinkOptions(props.cookies)),
        }),
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
