"use client";

import { api } from "~/trpc/react";
import { RouterOutputs } from "~/trpc/shared";
import { useService } from "../../_hooks/service";
import { useProject } from "../../../../_context/ProjectContext";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent } from "~/components/ui/drawer";
import { LogWindow, type LogLine } from "~/components/LogWindow";
import { StringParam, useQueryParam } from "use-query-params";

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
    <Drawer open={!!deploymentId} onClose={() => setDeploymentId(null)}>
      <DrawerContent className="max-h-full min-h-[80vh]">
        <div className="mx-auto h-full min-w-[40vw] max-w-4xl">
          <h2>Logs</h2>
          <div className="mb-8 max-h-[80vh] overflow-scroll whitespace-nowrap">
            {logs && <LogWindow logs={logs} />}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
