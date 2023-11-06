import { api } from "~/trpc/server";
import Test from "./RSC";
import { StatCard } from "./StatCard";

export default async function DashboardHome() {
  return (
    <div className="mx-auto max-w-[1500px]">
      <Test />
      <div className="m-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard />
        <StatCard />
        <StatCard />
        <StatCard />
      </div>
    </div>
  );
}
