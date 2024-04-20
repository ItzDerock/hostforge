import assert from "assert";
import type Dockerode from "dockerode";
import { z } from "zod";
import { projectMiddleware } from "~/server/api/middleware/project";
import { serviceMiddleware } from "~/server/api/middleware/service";
import { authenticatedProcedure } from "~/server/api/trpc";
import { type paths as DockerAPITypes } from "~/server/docker/types";
import logger from "~/server/utils/logger";
import { docker404ToNull } from "~/server/utils/serverUtils";
import { isDefined } from "~/utils/utils";

const zContainerDetails = z.object({
  containerId: z.string(),
  containerCreatedAt: z.number(),

  error: z.string().optional(),
  node: z.string().optional(),

  cpu: z.number().optional(),
  memory: z.number().optional(),
  network: z
    .object({
      tx: z.number().optional(),
      rx: z.number().optional(),
    })
    .optional(),
});

const zTaskDetails = z.object({
  taskMessage: z.string().optional(),
  taskState: z
    .enum([
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
    ])
    .optional(),

  slot: z.number(),
});

const getServiceContainersOutput = z.object({
  replication: z.object({
    running: z.number(),
    desired: z.number(),
  }),

  latest: z.array(
    z.object({
      slot: z.number(),
      container: zContainerDetails.optional(),
      task: zTaskDetails,

      previous: z.array(
        z.object({
          container: zContainerDetails.optional(),
          task: zTaskDetails,
        }),
      ),
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
  .use(projectMiddleware)
  .use(serviceMiddleware)
  .query(async ({ ctx }) => {
    // get docker service stats
    const service = (await ctx.docker
      .getService(`${ctx.project.internalName}_${ctx.service.name}`)
      .inspect()
      .catch(docker404ToNull)) as
      | DockerAPITypes["/services/{id}"]["get"]["responses"]["200"]["schema"]
      | null;

    if (!service)
      return {
        replication: {
          running: 0,
          desired: 0,
        },

        latest: [],
      };

    assert(service.ID, "Unable to retrieve service ID.");

    // list all the containers related to this service
    const containersPromise = ctx.docker
      .listContainers({
        all: true,
        filters: {
          label: [`com.docker.swarm.service.id=${service.ID}`],
        },
      })
      .catch((err: unknown) => {
        logger.error("Failed to list containers for service", {
          serviceId: service.ID,
          label: `com.docker.swarm.service.id=${service.ID}`,
          error: err,
        });

        throw new Error("Failed to list containers for service");
      });

    // and find the current task ID for this service
    const tasksPromise = (
      ctx.docker.listTasks({
        filters: {
          service: [service.ID],
        },
      }) as Promise<
        DockerAPITypes["/tasks"]["get"]["responses"]["200"]["schema"]
      >
    ).then((tasks) =>
      tasks.sort((a, b) => {
        // latest tasks go first
        if (a.UpdatedAt && b.UpdatedAt) {
          return (
            new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime()
          );
        } else {
          return 0;
        }
      }),
    );

    // and list all nodes
    const nodesPromise = ctx.docker.listNodes() as Promise<
      DockerAPITypes["/nodes"]["get"]["responses"]["200"]["schema"]
    >;

    const [containers, tasks, nodes] = await Promise.all([
      containersPromise,
      tasksPromise,
      nodesPromise,
    ]);

    // format the tasks into { container, task } objects
    const tasksWithContainers = await Promise.all(
      tasks.map(async (task) => {
        const container = containers.find(
          (container) =>
            container.Id === task.Status?.ContainerStatus?.ContainerID,
        );

        if (task.Slot === undefined) {
          logger.warn("Task has no slot: ", task);
          return;
        }

        let containerStats: Dockerode.ContainerStats | null = null;

        if (task.Status?.ContainerStatus?.ContainerID) {
          containerStats = await ctx.docker
            .getContainer(task.Status.ContainerStatus.ContainerID)
            .stats({ "one-shot": true, stream: false })
            .catch(docker404ToNull);
        }

        return {
          slot: task.Slot,

          container: containerStats
            ? {
                containerId: task.Status?.ContainerStatus?.ContainerID ?? "",
                containerCreatedAt: new Date(
                  container ? container.Created * 1000 : task.CreatedAt ?? 0,
                ).getTime(),
                error: task.Status?.Err,
                node: nodes.find((node) => node.ID === task.NodeID)?.Description
                  ?.Hostname,

                cpu: containerStats?.cpu_stats?.cpu_usage?.total_usage,
                memory: containerStats?.memory_stats?.usage,
                network: {
                  tx: containerStats?.networks?.eth0?.tx_bytes,
                  rx: containerStats?.networks?.eth0?.rx_bytes,
                },
              }
            : undefined,

          task: {
            taskMessage: task.Status?.Message,
            taskState: task.Status?.State,
            slot: task.Slot,
          },
        } satisfies Omit<
          z.infer<typeof getServiceContainersOutput>["latest"][number],
          "previous"
        >;
      }),
    ).then((tasks) => tasks.filter(isDefined));

    // find the latest task for each slot
    const latestTasks: Record<
      number,
      (typeof tasksWithContainers)[number]
      // DockerAPITypes["/tasks"]["get"]["responses"]["200"]["schema"][0]
    > = {};

    for (const task of tasksWithContainers) {
      if (!task) continue;

      if (!latestTasks[task.slot]) {
        latestTasks[task.slot] = task;
      }
    }

    const result = Object.values(latestTasks).map((task) => {
      return {
        ...task,
        previous: tasksWithContainers
          .filter((t) => t.slot === task.slot)
          .slice(1),
      };
    });

    return getServiceContainersOutput.parse({
      replication: {
        running: service.Spec?.Mode?.Replicated?.Replicas ?? 0,
        desired: service.Spec?.Mode?.Replicated?.Replicas ?? 0,
      },

      latest: result,
    });
  });
