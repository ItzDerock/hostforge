import { api } from "~/trpc/server";
import { SystemStatistics } from "./_components/SystemStatistics";

export default async function StatCards() {
  const [initialStats, historicalData] = await Promise.all([
    api.system.currentStats.query(),
    api.system.history.query(),
  ]);

  return (
    <SystemStatistics
      historicalData={historicalData}
      initialData={initialStats}
    />
  );
}
