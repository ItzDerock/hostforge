import { api } from "~/trpc/server";
import { SystemStatistics } from "./_components/SystemStatistics";
import { HostSelect } from "./_components/HostSelect";
import { MissingData } from "./_components/MissingData";
import { NoData } from "./_components/NoData";

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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- eslint broken
  const datapoints = Object.entries(historicalData).map(([key, value]) => [
    key,
    value.length,
  ]) as [string, number][];

  const someMissing = datapoints.some(([_, value]) => value == 0);
  const totalDatapoints = datapoints.reduce(
    (acc, [_, value]) => acc + value,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-row items-end">
        <h1 className="text-xl font-semibold">Statistics</h1>
        <div className="flex-grow" />
        {totalDatapoints === 0 ? (
          <NoData />
        ) : someMissing ? (
          <MissingData />
        ) : null}
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
