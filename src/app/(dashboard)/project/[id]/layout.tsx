import { Home, Plus, Settings2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";

export default async function ProjectPage(props: {
  params: { id: string };
  children: React.ReactNode;
}) {
  const project = await api.projects.get.query({ projectId: props.params.id });
  const healthy = project.services.filter(
    (s) =>
      s.stats?.ServiceStatus?.RunningTasks ==
      s.stats?.ServiceStatus?.DesiredTasks,
  ).length;

  return (
    <div>
      <h1 className="text-3xl font-bold">
        {project.friendlyName}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({project.internalName})
        </span>
      </h1>
      <h2 className="text-muted-foreground">
        {/* green dot = healthy, yellow = partial, red = all off */}
        <span
          className={`mr-1 inline-block h-3 w-3 rounded-full bg-${
            healthy == project.services.length
              ? "green"
              : healthy > 0
                ? "yellow"
                : "red"
          }-500`}
        />
        {healthy}/{project.services.length} Healthy Services
      </h2>

      <div className="mt-4 flex flex-row flex-wrap gap-4">
        {/* home */}
        <Button variant="outline" icon={Home} asChild>
          <Link href={`/project/${props.params.id}/home`}>Home</Link>
        </Button>

        {/* deploy changes */}
        <Button variant="outline" icon={UploadCloud}>
          Deploy Changes
        </Button>

        {/* new */}
        <Button variant="outline" icon={Plus}>
          New Service
        </Button>

        {/* settings */}
        <Button variant="outline" icon={Settings2}>
          <Link href={`/project/${props.params.id}/settings`}>Settings</Link>
        </Button>
      </div>

      <div className="flex flex-row gap-4 border-b-2 border-b-border py-8">
        {/* services */}
        <div className="flex flex-grow flex-row gap-2 overflow-x-auto">
          {project.services.map((service) => (
            <Link
              key={service.id}
              href={`/project/${props.params.id}/service/${service.id}`}
            >
              <div className="flex flex-row items-center gap-1">
                <div
                  className={`mr-1 inline-block h-3 w-3 rounded-full bg-${
                    service.stats?.ServiceStatus?.RunningTasks ==
                    service.stats?.ServiceStatus?.DesiredTasks
                      ? "green"
                      : service.stats?.ServiceStatus?.RunningTasks ?? 0 > 0
                        ? "yellow"
                        : "red"
                  }-500`}
                />
                <span>{service.name}</span>
              </div>
            </Link>
          ))}

          {project.services.length == 0 && (
            <span className="text-muted-foreground">No services found.</span>
          )}
        </div>
      </div>

      {props.children}
    </div>
  );
}
