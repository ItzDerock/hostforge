"use client";

import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { ServiceHealth, cn, parseServiceHealth } from "~/utils/utils";
import {
  useProject,
  type BasicServiceDetails,
} from "../_context/ProjectContext";

const STATUS_ICON_COLORS = {
  [ServiceHealth.Healthy]: "bg-green-500 border-green-400",
  [ServiceHealth.PartiallyHealthy]: "bg-yellow-500 border-yellow-400",
  [ServiceHealth.Unhealthy]: "bg-red-500 border-red-400",
  [ServiceHealth.Unknown]: "bg-gray-500 border-gray-400",
} as const;

export function ServiceCard({ service }: { service: BasicServiceDetails }) {
  const project = useProject();

  return (
    <Link href={`${project.path}/service/${service.name}`}>
      <div
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "px-6 py-4",
          project.selectedService?.id === service.id &&
            "cursor-default bg-card hover:bg-card",
        )}
      >
        <div className="flex flex-row items-center gap-1">
          <div
            className={`mr-1 inline-block h-3 w-3 rounded-full border-2 ${
              STATUS_ICON_COLORS[parseServiceHealth(service.status)]
            }`}
          />
          <span>{service.name}</span>
        </div>
      </div>
    </Link>
  );
}
