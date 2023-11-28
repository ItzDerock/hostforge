import { api } from "~/trpc/server";
import { SystemStatistics } from "./_components/SystemStatistics";
import { Project } from "./_components/Project";
import { Button } from "~/components/ui/button";
import { CreateProjectButton } from "./_components/CreateProject";
import YAMLEditor from "./_components/YAMLEditor";

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

      <div className="w-full">
        <h1>Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's a quick overview of your projects.
        </p>

        <div className="mt-4 flex flex-row justify-between align-bottom">
          <h2 className="mb-0 mt-auto block text-xl font-semibold">Projects</h2>
          {/* <Button variant="outline">Create project</Button> */}
          <CreateProjectButton />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-8">
        {/* <Project />
        <Project />
        <Project /> */}

        <YAMLEditor value="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" />
      </div>
    </div>
  );
}
