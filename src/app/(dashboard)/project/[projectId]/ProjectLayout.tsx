"use client";

import { Home, Settings2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { CreateService } from "./_components/CreateService";
import { DeployChanges } from "./_components/DeployChanges";
import { ServiceCard } from "./_components/ServiceCard";
import { ProjectContextProvider } from "./_context/ProjectContext";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { parseServiceHealth, ServiceHealth } from "~/utils/utils";

export function ProjectLayout(props: {
  project: RouterOutputs["projects"]["get"];
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectPath = `/project/${params.projectId as string}`;
  const servicePath = `${projectPath}/service/${params.serviceId as string}`;

  const project = api.projects.get.useQuery(
    { projectId: props.project.id },
    {
      initialData: props.project,
      refetchInterval: 60 * 1000, // every minute
    },
  );

  const healthy =
    project.data.services.filter(
      (s) => parseServiceHealth(s.status) === ServiceHealth.Healthy,
    ).length ?? 0;

  const selectedService =
    typeof params.serviceId === "string"
      ? project.data.services.find((service) =>
          [service.id, service.name].includes(params.serviceId as string),
        )
      : undefined;

  return (
    <ProjectContextProvider
      data={{
        ...project.data,
        path: projectPath,
        servicePath,
        selectedService,
      }}
    >
      <Breadcrumb>
        <BreadcrumbList className="mb-2 gap-1 sm:gap-1">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={projectPath}>
              {project.data.internalName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {selectedService && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={servicePath}>
                  {selectedService.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-row flex-wrap content-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {project.data.friendlyName}{" "}
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
        </div>

        <div className="flex flex-row flex-wrap content-center gap-4">
          {/* deploy changes */}
          <DeployChanges />

          {/* new */}
          <CreateService />

          {/* settings */}
          <Button variant="outline" icon={Settings2}>
            <Link href={`${projectPath}/settings`}>Settings</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-row gap-4 border-b-2 border-b-border py-4">
        {/* home */}
        <Link href={projectPath}>
          <Button variant="outline" icon={Home} className="h-full">
            Home
          </Button>
        </Link>

        {/* services */}
        <div className="flex flex-grow flex-row flex-wrap gap-2 align-middle">
          {project.data.services.map((service) => (
            <ServiceCard service={service} key={service.id} />
          ))}

          {project.data.services.length == 0 && (
            <span className="my-auto text-muted-foreground">No services.</span>
          )}
        </div>
      </div>

      {props.children}
    </ProjectContextProvider>
  );
}
