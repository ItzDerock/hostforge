import { api } from "~/trpc/server";
import { SystemStatistics } from "./_components/SystemStatistics";
import { HostSelect } from "./_components/HostSelect";

export default async function StatCards({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  const hosts = await api.system.hosts.query();
  let selectedHost: string | undefined;

  if (searchParams.host) {
    selectedHost = Array.isArray(searchParams.host)
      ? searchParams.host[0]
      : searchParams.host;
  } else {
    selectedHost = hosts.find((node) => node.isMainNode)!.id;
  }

  const [initialStats, historicalData] = await Promise.all([
    api.system.currentStats.query(),
    api.system.history.query({ instance: selectedHost! }),
  ]);

  console.log(historicalData);

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-row items-end justify-between">
        <h1 className="text-xl font-semibold">Statistics</h1>
        <HostSelect hosts={hosts} />
      </div>

      <SystemStatistics
        historicalData={historicalData}
        initialData={initialStats}
        hosts={hosts}
      />
    </div>
  );
}
