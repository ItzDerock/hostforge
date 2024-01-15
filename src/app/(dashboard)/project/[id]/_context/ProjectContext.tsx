"use client";

import { createContext, useContext } from "react";
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
  return useContext(ProjectContext);
};
