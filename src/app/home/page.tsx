import { api } from "~/trpc/server";
import Test from "./RSC";
import { StatCard } from "./StatCard";
import { SystemStatistics } from "./SystemStatistics";

export default async function DashboardHome() {
  const [initialStats, historicalData] = await Promise.all([
    api.system.currentStats.query(),
    api.system.history.query(),
  ]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <Test />
      <SystemStatistics
        initialData={initialStats}
        historicalData={historicalData}
      />
    </div>
  );
}
