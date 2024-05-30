"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useProject } from "../../../_context/ProjectContext";
import { type LogLine, LogWindow } from "~/components/LogWindow";
import LoadingScreen from "~/components/LoadingScreen";
import { NoDeployments } from "../../../_components/NoDeployments";

export default function ServiceLogsPage() {
  const project = useProject();
  const [logs, setLogs] = useState<LogLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  api.projects.services.serviceLogs.useSubscription(
    {
      projectId: project.id,
      serviceId: project.selectedService!.id,
    },
    {
      onData(data) {
        setLogs((log) => [...(log ?? []), JSON.parse(data) as LogLine]);
      },

      onError(err) {
        setError(String(err));
      },
    },
  );

  return (
    <div>
      <h1 className="mb-2 text-xl">Logs</h1>
      {logs === null && !error && <LoadingScreen />}
      {logs && <LogWindow logs={logs} className="max-h-[60vh]" />}
      {error && <NoDeployments />}
    </div>
  );
}
