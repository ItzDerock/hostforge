import { type TRPCLink } from "@trpc/client";
import { httpLink } from "@trpc/client/links/httpLink";
import { observable, tap } from "@trpc/server/observable";
import { toast } from "sonner";
import { type AppRouter } from "~/server/api/root";

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

/**
 * Logs errors to a toast
 */
export const toastLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      return next(op)
        .pipe(
          tap({
            // next(result) {},
            error(result) {
              if (op.context?.hideErrors) return;

              toast.error(result.message, {
                id: op.context?.toastId as string | undefined,
              });
            },
          }),
        )
        .subscribe(observer);
    });
  };
};
