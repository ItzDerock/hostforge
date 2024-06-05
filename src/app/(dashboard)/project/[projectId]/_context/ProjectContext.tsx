"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { createContext, useContext } from "react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";

export type BasicServiceDetails =
  RouterOutputs["projects"]["get"]["services"][number];
export type ProjectContextType = RouterOutputs["projects"]["get"] & {
  /**
   * Base project path
   * Example: `/project/123`
   */
  path: string;

  /**
   * Base service path
   * Example: `/project/123/service/456`
   */
  servicePath: string;
  selectedService?: BasicServiceDetails;
};

const ProjectContext = createContext<ProjectContextType>(
  {} as unknown as ProjectContextType,
);

export function ProjectContextProvider(props: {
  data: ProjectContextType;
  children: React.ReactNode;
}) {
  return (
    <ProjectContext.Provider value={props.data}>
      {props.children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => {
  const queryClient = useQueryClient();
  const project = useContext(ProjectContext);

  return {
    ...project,
    refetch: () => {
      return queryClient.invalidateQueries({
        queryKey: getQueryKey(
          api.projects.get,
          { projectId: project.id },
          "query",
        ),
      });
    },

    refetchService: () => {
      if (!project.selectedService) return;

      return queryClient.invalidateQueries({
        queryKey: getQueryKey(
          api.projects.services.get,
          { projectId: project.id, serviceId: project.selectedService.id },
          "query",
        ),
      });
    },
  };
};
