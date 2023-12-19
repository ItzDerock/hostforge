"use client";

import { createContext, useContext } from "react";
import { type RouterOutputs } from "~/trpc/shared";

type ProjectContextType = RouterOutputs["projects"]["get"];

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
