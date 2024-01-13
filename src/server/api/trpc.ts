/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { TRPCError, initTRPC } from "@trpc/server";
import cookie from "cookie";
import { type IncomingMessage, type ServerResponse } from "http";
import ipaddr from "ipaddr.js";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "~/server/db";
import { Session } from "../auth/Session";
import { getDockerInstance } from "../docker";
import { type Docker } from "../docker/docker";
import logger from "../utils/logger";
// import { OpenApiMeta, generateOpenApiDocument } from "trpc-openapi";

export type ExtendedRequest = IncomingMessage & {
  cookies: Record<string, string>;
  ip: string;
};

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */
interface CreateContextOptions {
  request: ExtendedRequest;
  response?: ServerResponse;
  session: Session | null;
  docker: Docker;
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    request: opts.request,
    response: opts.response,
    db,
    docker: opts.docker,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: {
  req: IncomingMessage;
  res?: ServerResponse;
}) => {
  // disable caching
  opts.res?.setHeader("Cache-Control", "no-store");

  // resolve real IP
  let forwardedFor = opts.req.headers["x-forwarded-for"];
  let ip = opts.req.socket.remoteAddress;

  if (forwardedFor) {
    if (Array.isArray(forwardedFor)) {
      logger.debug("Multiple forwarded-for headers found, using first");
      forwardedFor = forwardedFor[0];
    }

    ip = forwardedFor?.split(",")[0];
  }

  // now double check that the IP is valid
  if (!ip || !ipaddr.isValid(ip)) {
    logger.warn("Unable to resolve IP address from headers, using socket. ", {
      forwardedFor,
      ip,
    });
    ip = opts.req.socket.remoteAddress;
  }

  // set the IP
  (opts.req as ExtendedRequest).ip = ip ?? "";

  // resolve session data
  const cookies = ((opts.req as ExtendedRequest).cookies = cookie.parse(
    opts.req.headers.cookie ?? "",
  ));
  const sessionToken = cookies.sessionToken;

  // fetch session data from token
  const session: Session | null = sessionToken
    ? await Session.fetchFromTokenAndUpdate(sessionToken, {
        ip,
        ua: opts.req.headers["user-agent"] ?? undefined,
      })
    : null;

  return createInnerTRPCContext({
    session,
    request: opts.req as ExtendedRequest,
    response: opts.res,
    docker: await getDockerInstance(),
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
export const t = initTRPC
  // .meta<OpenApiMeta>()
  .context<typeof createTRPCContext>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Authenticated procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It guarantees
 * that a user querying is authorized, and you can access user session data.
 */
export const authenticatedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        // NOTE: if you change this, you must also change it in ~/trpc/react.ts
        cause: new Error("User is not logged in."),
        message: "You must be logged in to perform this action.",
      });
    }

    return next({
      ctx: {
        session: ctx.session,
      },
    });
  }),
);
