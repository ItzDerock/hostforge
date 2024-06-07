import { api } from "~/trpc/server";
import { SystemStatistics } from "./_components/SystemStatistics";
import { HostSelect } from "./_components/HostSelect";

export default async function StatCards() {
  const [initialStats, historicalData, hosts] = await Promise.all([
    api.system.currentStats.query(),
    api.system.history.query(),
    api.system.hosts.query(),
  ]);

  return (
    <>
      <HostSelect hosts={hosts} />
      <SystemStatistics
        historicalData={historicalData}
        initialData={initialStats}
        hosts={hosts}
      />
    </>
  );
}
