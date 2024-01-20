"use client";

import { api } from "~/trpc/react";
import { useProject } from "../../../_context/ProjectContext";

/**
 * Returns detailed information about a service (or the one currently navigated to)
 */
export function useService(serviceId?: string) {
  const project = useProject();
  serviceId ??= project?.selectedService?.id;

  if (!serviceId) {
    throw new Error("No service ID provided");
  }

  return api.projects.services.get.useQuery({
    projectId: project.id,
    serviceId,
  });
}
