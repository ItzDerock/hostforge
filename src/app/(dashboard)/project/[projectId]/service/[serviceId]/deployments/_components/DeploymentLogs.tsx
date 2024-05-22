"use client";

import { api } from "~/trpc/react";
import { useProject } from "../../../../_context/ProjectContext";
import { useState } from "react";
import { toast } from "sonner";
import { LogWindow, type LogLine } from "~/components/LogWindow";
import { StringParam, useQueryParam } from "use-query-params";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export function DeploymentLogs() {
  const project = useProject();
  const [logs, setLogs] = useState<LogLine[] | null>(null);
  const [deploymentId, setDeploymentId] = useQueryParam(
    "deploymentId",
    StringParam,
  );

  api.projects.services.deploymentLogs.useSubscription(
    {
      serviceId: project.selectedService!.id,
      deploymentId: deploymentId ?? "",
      projectId: project.id,
    },
    {
      onData(data) {
        setLogs((existing) => existing?.concat(data) ?? [data]);
      },

      onError(error) {
        console.error(error);
        toast.error("Failed to fetch logs: " + error.message);
      },

      enabled: !!deploymentId,
    },
  );

  return (
    <Dialog
      open={!!deploymentId}
      onOpenChange={(ev) => {
        if (!ev) {
          setLogs(null);
          setDeploymentId(undefined);
        }
      }}
    >
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Deployment Logs</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div className="mx-auto h-full max-h-[80vh] max-w-full overflow-scroll overflow-y-scroll text-white">
            {logs && <LogWindow logs={logs} />}
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
