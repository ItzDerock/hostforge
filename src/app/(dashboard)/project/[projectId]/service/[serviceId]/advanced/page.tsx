import { api } from "~/trpc/server";
import DeploymentSettings from "./DeploymentSettings";

export default async function AdvancedSettings(props: {
  params: { projectId: string; serviceId: string };
}) {
  const service = await api.projects.services.get.query({
    serviceId: props.params.serviceId,
    projectId: props.params.projectId,
  });

  return (
    <div>
      <DeploymentSettings service={service} />
    </div>
  );
}
