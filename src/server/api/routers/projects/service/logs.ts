import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { observable } from "@trpc/server/observable";
import assert from "node:assert";
import { docker404ToNull, streamSort } from "~/server/utils/serverUtils";
import { PassThrough, Transform } from "node:stream";
import type DockerModem from "docker-modem";
import { LogLevel } from "~/server/build/utils/BuilderLogger";
import type { LogLine } from "~/components/LogWindow";
import { Queue } from "datastructures-js";
import { Docker } from "~/server/docker/docker";

// trpc doesn't have stream support yet, so websockets it is

export const getDeploymentLogsSubscription = authenticatedProcedure
  .input(
    z.object({
      serviceId: z.string(),
      projectId: z.string(),
      deploymentId: z.string(),
    }),
  )
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .subscription(async ({ ctx, input }) => {
    const deployment = await ctx.service.getDeployment(input.deploymentId);
    assert(deployment, "Deployment not found");

    return observable<LogLine>((emit) => {
      const abort = new AbortController();
      const logs = deployment.readBuildLogs(abort.signal);

      logs.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n");

        for (const line of lines) {
          try {
            emit.next(JSON.parse(line) as LogLine);
          } catch (e) {
            emit.next({ l: LogLevel.Stderr, m: line });
          }
        }
      });

      logs.on("end", () => {
        emit.complete();
      });

      return () => {
        abort.abort();
        logs.destroy();
      };
    });
  });

export const getServiceLogsSubscription = authenticatedProcedure
  .input(
    z.object({
      serviceId: z.string(),
      projectId: z.string(),

      since: z.number().int().positive().optional(),
      tail: z.number().int().positive().optional(),
    }),
  )
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .subscription(async ({ ctx, input }) => {
    const abort = new AbortController();

    const service = ctx.docker.getService(ctx.service.toDockerServiceName());
    const logs = await service
      .logs({
        tail: input.tail,
        since: input.since,
        abortSignal: abort.signal,
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: true,
      })
      .catch(docker404ToNull);

    assert(
      logs,
      "Unable to retrieve service logs. Maybe the service is not running",
    );

    const unsorted = logs.pipe(Docker.demuxStream());
    const final = new PassThrough();

    streamSort(unsorted, final, (a, b) => {
      const aTime = JSON.parse(a.toString()).t;
      const bTime = JSON.parse(b.toString()).t;

      return aTime - bTime;
    });

    function cleanup() {
      unsorted.end();
    }

    // tail logs now
    return observable<string>((emit) => {
      final.on("data", (data: Buffer) => {
        emit.next(data.toString());
      });

      logs.on("end", () => {
        emit.complete();
        cleanup();
      });

      return () => {
        abort.abort();
        cleanup();
      };
    });
  });
