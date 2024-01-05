"use client";

import { Home, Settings2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { ProjectContextProvider } from "../_context/ProjectContext";
import { CreateService } from "./CreateService";
import { ServiceCard } from "./ServiceCard";

export function ProjectLayout(props: {
  project: RouterOutputs["projects"]["get"];
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectPath = `/project/${params.id as string}`;

  const project = api.projects.get.useQuery(
    { projectId: props.project.id },
    {
      initialData: props.project,
    },
  );

  const healthy =
    project.data.services.filter(
      (s) =>
        s.stats?.ServiceStatus?.RunningTasks ==
        s.stats?.ServiceStatus?.DesiredTasks,
    ).length ?? 0;

  return (
    <ProjectContextProvider
      data={{
        ...project.data,
        path: projectPath,
        selectedService:
          typeof params.serviceId === "string"
            ? project.data.services.find((service) =>
                [service.id, service.name].includes(params.serviceId as string),
              )
            : undefined,
      }}
    >
      <h1 className="text-3xl font-bold">
        {project.data.friendlyName}{" "}
        <span className="text-nowrap text-sm font-normal text-muted-foreground">
          ({project.data.internalName})
        </span>
      </h1>
      <h2 className="text-muted-foreground">
        {/* green dot = healthy, yellow = partial, red = all off */}
        <span
          className={`mr-1 inline-block h-3 w-3 rounded-full bg-${
            healthy == project.data.services.length
              ? "green"
              : healthy > 0
                ? "yellow"
                : "red"
          }-500`}
        />
        {healthy}/{project.data.services.length} Healthy Services
      </h2>

      <div className="mt-4 flex flex-row flex-wrap gap-4">
        {/* home */}
        <Link href={projectPath}>
          <Button variant="outline" icon={Home}>
            Home
          </Button>
        </Link>

        {/* deploy changes */}
        <Button variant="outline" icon={UploadCloud}>
          Deploy Changes
        </Button>

        {/* new */}
        <CreateService />

        {/* settings */}
        <Button variant="outline" icon={Settings2}>
          <Link href={`${projectPath}/settings`}>Settings</Link>
        </Button>
      </div>

      <div className="flex flex-row gap-4 border-b-2 border-b-border py-4">
        {/* services */}
        <div className="flex flex-grow flex-row flex-wrap gap-2">
          {project.data.services.map((service) => (
            <ServiceCard service={service} key={service.id} />
          ))}

          {project.data.services.length == 0 && (
            <span className="text-muted-foreground">No services found.</span>
          )}
        </div>
      </div>

      {props.children}
    </ProjectContextProvider>
  );
}
