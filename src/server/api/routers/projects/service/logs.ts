import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { observable } from "@trpc/server/observable";

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

    return observable<string>((emit) => {
      const abort = new AbortController();
      const logs = deployment.readBuildLogs(abort.signal);

      logs.on("data", (data: string) => {
        emit.next(data.toString());
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
    }),
  )
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .subscription(async ({ ctx, input }) => {
    // const service = await ctx.service.getService(input.serviceId);
    // return observable<string>((emit) => {
    //   const abort = new AbortController();
    //   const logs = service.readLogs(abort.signal);
    //   logs.on("data", (data: string) => {
    //     emit.next(data.toString());
    //   });
    //   logs.on("end", () => {
    //     emit.complete();
    //   });
    //   return () => {
    //     abort.abort();
    //     logs.destroy();
    //   };
    // });
  });
