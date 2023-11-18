import { api } from "~/trpc/server";
import { SystemStatistics } from "./_components/SystemStatistics";
import { Project } from "./_components/Project";

export default async function DashboardHome() {
  const [initialStats, historicalData] = await Promise.all([
    api.system.currentStats.query(),
    api.system.history.query(),
  ]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <SystemStatistics
        initialData={initialStats}
        historicalData={historicalData}
      />

      <div className="mt-4 grid grid-cols-2 gap-8">
        <Project />
        <Project />
        <Project />
      </div>
    </div>
  );
}
