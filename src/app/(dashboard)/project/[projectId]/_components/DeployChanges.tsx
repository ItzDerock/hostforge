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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { ServiceDiff } from "~/components/service/ServiceDiff";

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

  return (
    <Dialog>
      <DialogTrigger>
        <Button
          variant="outline"
          icon={UploadCloud}
          onClick={() => diff.refetch()}
          isLoading={mutation.isPending}
        >
          Deploy Changes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deployment Confirmation</DialogTitle>
        </DialogHeader>
        <DialogDescription className="max-w-full">
          {diff.isFetching && <LoadingSpinner />}

          {diff.data?.map(({ service, diff }) => (
            <div key={service.id} className="mb-4">
              <h2 className="text-lg font-bold">{service.name}</h2>
              <pre className="text-sm text-gray-400">
                <ServiceDiff diff={diff} />
              </pre>
            </div>
          ))}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
