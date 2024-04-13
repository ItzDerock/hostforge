import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/server";
import { SystemStatistics } from "./_components/SystemStatistics";
import { ProjectList } from "./_projects/ProjectList";

export default async function DashboardHome() {
  const [initialStats, historicalData, projects, user] = await Promise.all([
    api.system.currentStats.query(),
    api.system.history.query(),
    api.projects.list.query(),
    api.auth.me.query(),
  ]);

  return (
    <div className="mx-auto">
      <SystemStatistics
        initialData={initialStats}
        historicalData={historicalData}
      />

      <Card className="mt-8 bg-gradient-to-br from-primary to-accent py-4 text-accent-foreground">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">
            Welcome Back, {user.username}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-primary-foreground/75">
            <Check className="mr-2 inline-block" />
            Hostforge is up to date. (v1.0.0)
            <br />
            <Check className="mr-2 inline-block" />
            All services are running.
          </p>
        </CardContent>
      </Card>

      <ProjectList defaultValue={projects} />
    </div>
  );
}
