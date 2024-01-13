"use client";

import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useProject } from "../_context/ProjectContext";

export function DeployChanges() {
  const project = useProject();
  const mutation = api.projects.deploy.useMutation({
    onSuccess: () => {
      toast.success("Deployed!");
    },
  });

  return (
    <Button
      variant="outline"
      icon={UploadCloud}
      onClick={() =>
        mutation.mutate({
          projectId: project.id,
        })
      }
      isLoading={mutation.isPending}
    >
      Deploy Changes
    </Button>
  );
}
