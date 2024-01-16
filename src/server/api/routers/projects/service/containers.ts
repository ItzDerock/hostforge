import assert from "assert";
import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { type paths as DockerAPITypes } from "~/server/docker/types";

const getServiceContainersOutput = z.object({
  replication: z.object({
    running: z.number(),
    desired: z.number(),
  }),

  containers: z.array(
    z.object({
      status: z
        .string({
          description:
            "Same as [].Status https://docs.docker.com/engine/api/v1.43/#tag/Container/operation/ContainerList",
        })
        .optional(),
      state: z
        .string({
          description:
            "Same as [].State https://docs.docker.com/engine/api/v1.43/#tag/Container/operation/ContainerList",
        })
        .optional(),
      taskState: z.enum([
        "complete",
        "new",
        "allocated",
        "pending",
        "assigned",
        "accepted",
        "preparing",
        "ready",
        "starting",
        "running",
        "shutdown",
        "failed",
        "rejected",
        "remove",
        "orphaned",
      ]),

      containerId: z.string(),
      containerCreatedAt: z.number(),
      taskUpdatedAt: z.number(),

      error: z.string().optional(),
      node: z.string().optional(),
    }),
  ),
});

export const getServiceContainers = authenticatedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/api/projects/:projectId/services/:serviceId/containers",
      summary: "Get service containers",
    },
  })
  .input(
    z.object({
      projectId: z.string(),
      serviceId: z.string(),
    }),
  )
  .output(getServiceContainersOutput)
  // .output(z.unknown())
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .query(async ({ ctx, input }) => {
    // get docker service stats
    const service = (await ctx.docker
      .getService(`${ctx.project.internalName}_${ctx.service.name}`)
      .inspect()) as DockerAPITypes["/services/{id}"]["get"]["responses"]["200"]["schema"];

    assert(service.ID, "Unable to retrieve service ID.");

    // list all the containers related to this service
    const containersPromise = ctx.docker.listContainers({
      all: true,
      filters: {
        label: [`com.docker.swarm.service.id=${service.ID}`],
      },
    });

    // and find the current task ID for this service
    const tasksPromise = ctx.docker.listTasks({
      filters: {
        service: [service.ID],
      },
    }) as Promise<
      DockerAPITypes["/tasks"]["get"]["responses"]["200"]["schema"]
    >;

    // and list all nodes
    const nodesPromise = ctx.docker.listNodes() as Promise<
      DockerAPITypes["/nodes"]["get"]["responses"]["200"]["schema"]
    >;

    const [containers, tasks, nodes] = await Promise.all([
      containersPromise,
      tasksPromise,
      nodesPromise,
    ]);

    // format stats
    const formatted = {
      serviceId: service.ID,

      replication: {
        running: service.Spec?.Mode?.Replicated?.Replicas ?? 0,
        desired: service.Spec?.Mode?.Replicated?.Replicas ?? 0,
      },

      containers: tasks
        .sort((a, b) => {
          // order in descending order of creation
          if (a.CreatedAt && b.CreatedAt) {
            return (
              new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
            );
          } else {
            return 0;
          }
        })
        .map((task) => {
          // find the associated container
          const container = containers.find(
            (container) =>
              container.Id === task.Status?.ContainerStatus?.ContainerID,
          );

          const taskUpdatedAt = new Date(task.UpdatedAt ?? 0).getTime();
          const containerCreatedAt = new Date(
            container?.Created ?? 0,
          ).getTime();

          return {
            status: container?.Status,
            state: container?.State,
            taskState: task.Status?.State,

            containerId: task.Status?.ContainerStatus?.ContainerID ?? "",
            containerCreatedAt,
            taskUpdatedAt,

            error: task.Status?.Err,
            node: nodes.find((node) => node.ID === task.NodeID)?.Description
              ?.Hostname,
          };
        }),
    };

    // return formatted;

    // I don't feel like writing a lot of assert's because for some reason all the types are `| undefined` and I don't know why
    return getServiceContainersOutput.parse(formatted);
  });
