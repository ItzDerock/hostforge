"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { ClipboardIcon } from "lucide-react";
import { FaGear } from "react-icons/fa6";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
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

export default function Containers() {
  const project = useProject();

  const containers = api.projects.services.containers.useQuery({
    serviceId: project.selectedService!.id,
    projectId: project.id,
  });

  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Container ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {containers.data?.containers.map((container) => (
          <TableRow key={container.containerId}>
            <TableCell
              className="cursor-pointer font-mono text-sm text-muted-foreground"
              onClick={() => {
                if (!navigator.clipboard || !window.isSecureContext) {
                  return toast.error(
                    "Cannot copy to clipboard when not using HTTPS.",
                  );
                }

                navigator.clipboard
                  .writeText(container.containerId)
                  .then(() => {
                    toast.success("Copied to clipboard.");
                  })
                  .catch((err) => {
                    console.error(err);
                    toast.error("Failed to copy to clipboard");
                  });
              }}
            >
              {container.containerId?.substring(0, 8) ?? "N/A (deploying)"}
              {container.containerId && (
                <ClipboardIcon
                  size={14}
                  strokeWidth={1.5}
                  className="ml-2 inline-block stroke-muted-foreground"
                />
              )}
            </TableCell>
            <TableCell>Deployed (updated)</TableCell>
            <TableCell>{container.error}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <span className="sr-only">Actions</span>
                    <FaGear />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>test</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
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
