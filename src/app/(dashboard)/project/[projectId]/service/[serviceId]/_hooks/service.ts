"use client";

import { use } from "react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { type Awaitable } from "~/utils/utils";
import { useProject } from "../../../_context/ProjectContext";

/**
 * Returns detailed information about a service (or the one currently navigated to)
 */
export function useService(
  serviceId?: string,
  defaultData?: Awaitable<RouterOutputs["projects"]["services"]["get"]>,
) {
  const project = useProject();
  serviceId ??= project?.selectedService?.id;

  if (!serviceId) {
    throw new Error("No service ID provided");
  }

  return api.projects.services.get.useQuery(
    {
      projectId: project.id,
      serviceId,
    },
    {
      initialData:
        // use(
        //   apiServer.projects.services.get.query({
        //       projectId: project.id,
        //       serviceId: serviceId,
        //     })
        // ),
        defaultData instanceof Promise ? use(defaultData) : defaultData,
    },
  );
}
