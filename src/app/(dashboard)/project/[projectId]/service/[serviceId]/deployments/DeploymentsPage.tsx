"use client";

import { api } from "~/trpc/react";
import { DeploymentCard } from "./_components/DeploymentCard";
import { DeploymentLogs } from "./_components/DeploymentLogs";
import { NoDeployments } from "../../../_components/NoDeployments";
import type { RouterOutputs } from "~/trpc/shared";

export default function DeploymentsPage({
  serviceId,
  projectId,
  defaultDeployments,
}: {
  serviceId: string;
  projectId: string;
  defaultDeployments: RouterOutputs["projects"]["services"]["deployments"];
}) {
  const { data } = api.projects.services.deployments.useQuery(
    {
      projectId,
      serviceId,
    },
    {
      initialData: defaultDeployments,
      refetchOnMount: true,
      refetchInterval: 30 * 1000,
    },
  );

  return (
    <div>
      <h1 className="text-xl">Deployments</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {data.length} total deployments.
      </p>
      <ul className="flex flex-col gap-2">
        {data
          .sort((a, b) => a.deployedAt - b.deployedAt)
          .map((deployment) => (
            <li key={deployment.id}>
              <DeploymentCard deployment={deployment} />
            </li>
          ))}

        {data.length === 0 && <NoDeployments />}
      </ul>

      <DeploymentLogs />
    </div>
  );
}
