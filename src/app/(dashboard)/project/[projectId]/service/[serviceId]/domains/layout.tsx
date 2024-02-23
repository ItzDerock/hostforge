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

  return <DomainsList defaultData={service} />;
}
