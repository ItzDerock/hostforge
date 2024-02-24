import { type ReactNode } from "react";
import { api } from "~/trpc/server";
import DomainsList from "./DomainsList";

export default async function DomainsLayout(props: {
  params: {
    projectId: string;
    serviceId: string;
  };

  children: ReactNode;
}) {
  const service = await api.projects.services.get.query({
    projectId: props.params.projectId,
    serviceId: props.params.serviceId,
  });

  return (
    <>
      <div className="flex flex-row gap-4 rounded-lg border-border bg-card">
        <div className="w-2 rounded-bl-lg rounded-tl-lg bg-primary" />
        <p className="py-4 pr-4 text-primary-foreground">
          By exposing this service, it will be added to a global network for the
          reverse proxy and thus will be able to communicate with other services
          from different projects that also have an exposed domain. To avoid
          this, consider setting up a separate proxy (traefik, freenginx, etc)
          for this project and expose that instead.
        </p>
      </div>

      <DomainsList defaultData={service}>{props.children}</DomainsList>
    </>
  );
}
