"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { useProject } from "../../../_context/ProjectContext";
import { ContainerEntry } from "./_components/ContainerEntry";

export default function ContainersPage({
  initialData,
}: {
  initialData: RouterOutputs["projects"]["services"]["containers"];
}) {
  const project = useProject();

  const containers = api.projects.services.containers.useQuery(
    {
      serviceId: project.selectedService!.id,
      projectId: project.id,
    },
    {
      initialData,
      refetchInterval: 5_000,
    },
  );

  return (
    <Table className="w-full text-nowrap">
      <TableHeader>
        <TableRow>
          <TableHead className="w-36 whitespace-nowrap">Container ID</TableHead>
          <TableHead className="w-[80%]">Status</TableHead>
          <TableHead>Uptime</TableHead>
          <TableHead>Node</TableHead>
          <TableHead>CPU</TableHead>
          <TableHead className="whitespace-nowrap">
            Memory (used/limit)
          </TableHead>
          <TableHead className="whitespace-nowrap">Network (RX/TX)</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {containers.data?.latest.map((data) => (
          <ContainerEntry data={data} key={data.slot} />
        ))}

        {containers.data && containers.data.latest.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center align-middle">
              No containers running. Try hitting the{" "}
              <strong>Deploy Changes</strong> button to deploy the service.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
