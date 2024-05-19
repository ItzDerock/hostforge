"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useProject } from "../../../_context/ProjectContext";
import { type LogLine, LogWindow } from "~/components/LogWindow";

export default function ServiceLogsPage() {
  const project = useProject();
  const [logs, setLogs] = useState<LogLine[] | null>(null);

  api.projects.services.serviceLogs.useSubscription(
    {
      projectId: project.id,
      serviceId: project.selectedService!.id,
    },
    {
      onData(data) {
        setLogs((log) => [...(log ?? []), JSON.parse(data) as LogLine]);
      },
    },
  );

  return (
    <div>
      <h1 className="text-xl">Logs</h1>
      <pre className="max-h-[80vh] rounded-md bg-card p-4 text-white">
        {logs && <LogWindow logs={logs} />}
      </pre>
    </div>
  );
}
