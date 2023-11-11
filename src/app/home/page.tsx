import { api } from "~/trpc/server";
import Test from "./RSC";
import { StatCard } from "./StatCard";
import { SystemStatistics } from "./SystemStatistics";

export default async function DashboardHome() {
  const initialStats = await api.system.currentStats.query();

  return (
    <div className="mx-auto max-w-[1500px]">
      <Test />
      <SystemStatistics initialData={initialStats} />
    </div>
  );
}
