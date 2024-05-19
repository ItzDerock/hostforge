"use client";

import { CheckCircle, TextIcon, UploadCloud, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { NumberParam, StringParam, useQueryParam } from "use-query-params";
import { AbsoluteDate, RelativeDate } from "~/components/Date";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ServiceDeploymentStatus } from "~/server/db/types";
import type { RouterOutputs } from "~/trpc/shared";
import { DeploymentLogs } from "./DeploymentLogs";

const SERVICE_DEPLOYMENT_STATUS_TRANSFORM = {
  [ServiceDeploymentStatus.BuildPending]:
    "Pending - waiting for available builder",
  [ServiceDeploymentStatus.Building]: "Building - building image...",
  [ServiceDeploymentStatus.Deploying]: "Deploying - deploying image...",
  [ServiceDeploymentStatus.Failed]: "Failed",
  [ServiceDeploymentStatus.Success]: "Success",
} as const satisfies Record<ServiceDeploymentStatus, string>;

const SERVICE_DEPLOYMENT_STATUS_ICON = {
  [ServiceDeploymentStatus.BuildPending]: <LoadingSpinner />,
  [ServiceDeploymentStatus.Building]: <LoadingSpinner />,
  [ServiceDeploymentStatus.Deploying]: (
    <UploadCloud size={24} className="animate-pulse" />
  ),
  [ServiceDeploymentStatus.Failed]: (
    <XCircle size={24} className="text-red-500" />
  ),
  [ServiceDeploymentStatus.Success]: (
    <CheckCircle size={24} className="text-green-500" />
  ),
};

export function DeploymentCard({
  deployment,
}: {
  deployment: RouterOutputs["projects"]["services"]["deployments"][number];
}) {
  const [_, setDeploymentId] = useQueryParam("deploymentId", StringParam);

  return (
    <Card>
      <div className="flex flex-row items-center p-4">
        <div className="flex-grow">
          <h2 className="flex flex-row items-center gap-2 align-middle text-lg capitalize">
            {SERVICE_DEPLOYMENT_STATUS_ICON[deployment.status]}{" "}
            {SERVICE_DEPLOYMENT_STATUS_TRANSFORM[deployment.status]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {Date.now() - deployment.deployedAt > 1000 * 60 * 60 * 24 * 3 ? (
              <AbsoluteDate date={new Date(deployment.deployedAt)} />
            ) : (
              <RelativeDate date={new Date(deployment.deployedAt)} />
            )}
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => {
              setDeploymentId(deployment.id);
            }}
          >
            <TextIcon size={18} className="mr-1 inline-block" /> View Logs
          </Button>
        </div>
      </div>
    </Card>
  );
}
