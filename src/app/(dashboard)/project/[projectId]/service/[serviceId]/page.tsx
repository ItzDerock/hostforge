import { redirect } from "next/navigation";

export default function ServicePage({
  params: { serviceId, projectId },
}: {
  params: { serviceId: string; projectId: string };
}) {
  redirect(`/project/${projectId}/service/${serviceId}/home`);
}
