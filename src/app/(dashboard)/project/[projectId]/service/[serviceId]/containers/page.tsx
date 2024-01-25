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
import { useProject } from "../../../_context/ProjectContext";
import { ContainerEntry } from "./_components/ContainerEntry";

export default function Containers() {
  const project = useProject();

  const containers = api.projects.services.containers.useQuery(
    {
      serviceId: project.selectedService!.id,
      projectId: project.id,
    },
    {
      refetchInterval: 5_000,
    },
  );

  return (
    <Table className="w-full text-nowrap">
      <TableHeader>
        <TableRow>
          <TableHead className="w-36">Container ID</TableHead>
          <TableHead className="w-[80%]">Status</TableHead>
          <TableHead>Uptime</TableHead>
          <TableHead>Node</TableHead>
          <TableHead>CPU</TableHead>
          <TableHead>Memory</TableHead>
          <TableHead>Network (RX/TX)</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {containers.data?.latest.map((data) => (
          <ContainerEntry data={data} key={data.slot} />
        ))}

        {project.services.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              No services
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
