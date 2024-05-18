import { api } from "~/trpc/server";
import { DeploymentCard } from "./_components/DeploymentCard";

export default async function DeploymentsPage({
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
    <div>
      <h1 className="text-xl">Deployments</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {deployments.length} total deployments.
      </p>
      <ul className="flex flex-col gap-2">
        {deployments
          .sort((a, b) => b.deployedAt - a.deployedAt)
          .map((deployment) => (
            <li key={deployment.id}>
              <DeploymentCard deployment={deployment} />
            </li>
          ))}
      </ul>
    </div>
  );
}
