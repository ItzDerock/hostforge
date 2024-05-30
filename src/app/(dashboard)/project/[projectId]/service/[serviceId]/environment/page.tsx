import { api } from "~/trpc/server";
import EnvironmentPage from "./_components/EnvironmentPage";

export default async function Page({
  params: { serviceId, projectId },
}: {
  params: { serviceId: string; projectId: string };
}) {
  const service = await api.projects.services.get.query({
    serviceId,
    projectId,
  });

  return (
    <section>
      <h1 className="text-lg">Environment Variables</h1>
      <p className="mb-2 text-muted-foreground">
        Enter environment variables in KEY=VALUE format. Separate multiple
        variables with a newline.
      </p>

      <EnvironmentPage
        serviceId={serviceId}
        projectId={projectId}
        defaultEnv={service.latestGeneration?.environment ?? ""}
      />
    </section>
  );
}
