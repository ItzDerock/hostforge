import { DeleteButton } from "../_components/DeleteButton";

export default function ServicePage({
  params: { serviceId },
}: {
  params: { serviceId: string };
}) {
  return (
    <div>
      Hello world from {serviceId} <DeleteButton serviceId={serviceId} />
    </div>
  );
}
