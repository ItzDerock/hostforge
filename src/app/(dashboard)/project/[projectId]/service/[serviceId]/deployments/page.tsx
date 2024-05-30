import { api } from "~/trpc/server";
import DeploymentsPage from "./DeploymentsPage";

export default async function Page({
  params: { serviceId, projectId },
}: {
  params: {
    serviceId: string;
    projectId: string;
  };
}) {
  const deployments = await api.projects.services.deployments.query({
    projectId,
    serviceId,
  });

  return (
    <DeploymentsPage
      defaultDeployments={deployments}
      projectId={projectId}
      serviceId={serviceId}
    />
  );
}
