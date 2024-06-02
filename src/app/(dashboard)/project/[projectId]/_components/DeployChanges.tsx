"use client";

import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useProject } from "../_context/ProjectContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { ServiceDiff } from "~/components/service/ServiceDiff";
import { useMemo } from "react";
import { Operation } from "json-diff-ts";

export function DeployChanges() {
  const project = useProject();
  const mutation = api.projects.deploy.useMutation({
    onSuccess: () => {
      toast.success("Deployed!");
    },
  });

  const diff = api.projects.deployDiff.useQuery({
    projectId: project.id,
  });

  const servicesWithChanges = useMemo(
    () => diff.data?.filter(({ diff }) => Object.keys(diff).length != 0) ?? [],
    [diff.data],
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          icon={UploadCloud}
          onClick={() => diff.refetch()}
          isLoading={mutation.isPending || project.isDeploying}
        >
          Deploy Changes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Deployment Confirmation</DialogTitle>
        </DialogHeader>
        <DialogDescription className="max-h-[60vh] max-w-full overflow-auto">
          The following changes will be deployed to the production environment,
          and new builds will be triggered if required.
          <br /> <br />
          {diff.isFetching && <LoadingSpinner />}
          {servicesWithChanges.map(({ service, diff }) => (
            <div key={service.id} className="mb-4">
              <h2 className="text-lg font-bold text-white">
                Service: {service.name}
              </h2>
              <div className="grid grid-cols-1 gap-4 text-sm lg:grid-cols-2">
                {"type" in diff &&
                diff.key === "serviceId" &&
                diff.type === Operation.ADD ? (
                  <p className="col-span-2">Service Created</p>
                ) : (
                  <ServiceDiff diff={diff} />
                )}
              </div>
            </div>
          ))}
          {servicesWithChanges.length === 0 && "No changes to deploy."}
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate({ projectId: project.id })}
            isLoading={mutation.isPending}
          >
            Deploy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
