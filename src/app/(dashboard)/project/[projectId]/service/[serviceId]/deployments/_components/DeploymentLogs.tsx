"use client";

import { api } from "~/trpc/react";
import { RouterOutputs } from "~/trpc/shared";
import { useService } from "../../_hooks/service";
import { useProject } from "../../../../_context/ProjectContext";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent } from "~/components/ui/drawer";

export function DeploymentLogs({
  deployment,
}: {
  deployment: RouterOutputs["projects"]["services"]["deployments"][number];
}) {
  const project = useProject();
  const [logs, setLogs] = useState<string | null>(null);

  api.projects.services.deploymentLogs.useSubscription(
    {
      serviceId: project.selectedService!.id,
      deploymentId: deployment.id,
      projectId: project.id,
    },
    {
      onData(data) {
        setLogs(
          (existing) =>
            (existing += data
              .split("\n")
              .map((it) => {
                try {
                  return JSON.parse(it);
                } catch (error) {
                  return { m: it };
                }
              })
              .map((it) => it.m)
              .join("\n")),
        );
      },

      onError(error) {
        console.error(error);
        toast.error("Failed to fetch logs: " + error.message);
      },
    },
  );

  return (
    <Drawer open={true}>
      <DrawerContent className="max-h-full min-h-[80vh]">
        <div className="mx-auto h-full min-w-[40vw] max-w-4xl">
          <h2>Logs</h2>
          {/* <pre>{logs}</pre> */}
          <textarea
            readOnly
            value={logs}
            style={{
              width: "100%",
              height: "100%",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
