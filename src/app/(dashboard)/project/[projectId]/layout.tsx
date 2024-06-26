import { api } from "~/trpc/server";
import { ProjectLayout } from "./ProjectLayout";

export default async function ProjectPage(props: {
  params: { projectId: string };
  children: React.ReactNode;
}) {
  const project = await api.projects.get.query({
    projectId: props.params.projectId,
  });

  return <ProjectLayout project={project}>{props.children}</ProjectLayout>;
}
