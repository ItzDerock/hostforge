import { api } from "~/trpc/server";
import { SystemStatistics } from "./_components/SystemStatistics";
import { ProjectList } from "./_projects/ProjectList";

export default async function DashboardHome() {
  const [initialStats, historicalData, projects] = await Promise.all([
    api.system.currentStats.query(),
    api.system.history.query(),
    api.projects.list.query(),
  ]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <SystemStatistics
        initialData={initialStats}
        historicalData={historicalData}
      />

      <div className="w-full">
        <h1>Welcome back!</h1>
        <p className="text-muted-foreground">
          Here&apos;s a quick overview of your projects.
        </p>
      </div>

      <ProjectList defaultValue={projects} />
    </div>
  );
}
