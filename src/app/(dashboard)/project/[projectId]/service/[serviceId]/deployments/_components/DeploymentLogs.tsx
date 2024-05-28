"use client";

import { api } from "~/trpc/react";
import { useProject } from "../../../../_context/ProjectContext";
import { useState } from "react";
import { toast } from "sonner";
import { LogWindow, type LogLine, LogLevel } from "~/components/LogWindow";
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
        setLogs([
          {
            l: LogLevel.Stderr,
            m: "Failed to fetch logs: " + error.message,
          },
        ]);
      },

      onStarted() {
        setLogs([]);
      },

      enabled: !!deploymentId,
    },
  );

  return (
    <Dialog
      open={!!deploymentId}
      onOpenChange={(ev) => {
        if (!ev) {
          setDeploymentId(undefined);
        } else {
          setLogs(null);
        }
      }}
    >
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Build Logs</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div>
            {logs && (
              <LogWindow logs={logs} className="max-h-[80vh]" supressStderr />
            )}
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
