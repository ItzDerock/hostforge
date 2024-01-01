"use client";

import { Home, Settings2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { ProjectContextProvider } from "../_context/ProjectContext";
import { CreateService } from "./CreateService";

const STATUS_ICON_COLORS = {
  Healthy: "bg-green-500 border-green-400",
  Partial: "bg-yellow-500 border-yellow-400",
  Unhealthy: "bg-red-500 border-red-400",
  Unknown: "bg-gray-500 border-gray-400",
} as const;

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
    <ProjectContextProvider data={project.data}>
      <h1 className="text-3xl font-bold">
        {project.data.friendlyName}{" "}
        <span className="text-sm font-normal text-muted-foreground">
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

      <div className="flex flex-row gap-4 border-b-2 border-b-border py-8">
        {/* services */}
        <div className="flex flex-grow flex-row gap-2 overflow-x-auto">
          {project.data.services.map((service) => (
            <Link
              key={service.id}
              href={`${projectPath}/service/${service.id}`}
            >
              <div className="flex flex-row items-center gap-1">
                <div
                  className={`mr-1 inline-block h-3 w-3 rounded-full border-2 ${
                    service.stats?.ServiceStatus?.RunningTasks == undefined
                      ? STATUS_ICON_COLORS.Unknown
                      : service.stats?.ServiceStatus?.RunningTasks ==
                          service.stats?.ServiceStatus?.DesiredTasks
                        ? STATUS_ICON_COLORS.Healthy
                        : service.stats?.ServiceStatus?.RunningTasks ?? 0 > 0
                          ? STATUS_ICON_COLORS.Partial
                          : STATUS_ICON_COLORS.Unhealthy
                  }`}
                />
                <span>{service.name}</span>
              </div>
            </Link>
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
