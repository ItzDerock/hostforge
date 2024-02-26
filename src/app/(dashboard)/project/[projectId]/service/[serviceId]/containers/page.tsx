import { api } from "~/trpc/server";
import ContainersPage from "./ContainersList";

export default async function ContainersListPage({
  params: { serviceId, projectId },
}: {
  params: {
    serviceId: string;
    projectId: string;
  };
}) {
  const data = await api.projects.services.containers.query({
    serviceId,
    projectId,
  });

  return <ContainersPage initialData={data} />;
}
