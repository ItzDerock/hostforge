import { type TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { type AppRouter } from "~/server/api/root";
import { httpLink } from "@trpc/client/links/httpLink";

type LinkOptions = Parameters<typeof httpLink>[0];

/**
 * Simple re-implementation of httpLink, except it only acts as a terminating link for requests to *auth* routes.
 * Cannot set cookies in a streaming response, but we don't want to require every request to be a non-streaming batch request, so this is the best option.
 */
export const authLink: (opts: LinkOptions) => TRPCLink<AppRouter> = (opts) => {
  const originalLink = httpLink<AppRouter>(opts);

  return (runtime) =>
    ({ next, op }) => {
      return observable((observer) => {
        if (!op.path.startsWith("auth.")) {
          return next(op).subscribe(observer);
        }

        originalLink(runtime)({ next, op }).subscribe(observer);
      });
    };
};
