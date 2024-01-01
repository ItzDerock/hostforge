"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useProject } from "../../../_context/ProjectContext";

export function DeleteButton(props: { serviceId: string }) {
  const project = useProject();
  const client = useQueryClient();
  const mutate = api.projects.services.delete.useMutation({
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: getQueryKey(
          api.projects.get,
          { projectId: project.id },
          "query",
        ),
      });
    },

    onError: (err) => {
      console.log("fail:", err);
      toast.error(err.message);
    },
  });

  return (
    <Button
      variant="destructive"
      isLoading={mutate.isPending}
      onClick={() => {
        mutate.mutate({
          projectId: project.id,
          serviceId: props.serviceId,
        });
      }}
    >
      Delete
    </Button>
  );
}
