"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ClipboardIcon } from "lucide-react";
import prettyBytes from "pretty-bytes";
import { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { FaGear } from "react-icons/fa6";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { TableCell, TableRow } from "~/components/ui/table";
import { type RouterOutputs } from "~/trpc/shared";

export function ContainerEntry({
  data: { container, previous, task },
}: {
  data: RouterOutputs["projects"]["services"]["containers"]["latest"][number];
}) {
  const mainContainer = container ?? previous[0]?.container;
  const isRedeploying =
    container === undefined || task.taskState === "starting";

  const [uptimeText, setUptimeText] = useState<string | null>(
    mainContainer
      ? formatDistanceToNowStrict(mainContainer.containerCreatedAt)
      : null,
  );
  useEffect(() => {
    if (!mainContainer) return;
    const interval = setInterval(() => {
      setUptimeText(
        formatDistanceToNowStrict(mainContainer.containerCreatedAt),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [mainContainer]);

  return (
    <>
      <TableRow className="whitespace-nowrap">
        <TableCell
          className="cursor-pointer font-mono text-sm text-muted-foreground"
          onClick={() => {
            if (!mainContainer) return;
            if (!navigator.clipboard || !window.isSecureContext) {
              return toast.error(
                "Cannot copy to clipboard when not using HTTPS.",
              );
            }

            navigator.clipboard
              .writeText(mainContainer.containerId)
              .then(() => {
                toast.success("Copied to clipboard.");
              })
              .catch((err) => {
                console.error(err);
                toast.error("Failed to copy to clipboard");
              });
          }}
        >
          {mainContainer?.containerId?.substring(0, 8) ?? "N/A (deploying)"}
          {mainContainer?.containerId && (
            <ClipboardIcon
              size={14}
              strokeWidth={1.5}
              className="ml-2 inline-block stroke-muted-foreground"
            />
          )}
        </TableCell>
        <TableCell className="text-wrap">
          {isRedeploying ? (
            <span className="px-2">
              <CgSpinner
                size={14}
                strokeWidth={1.5}
                className="py-auto mr-2 inline-block animate-spin stroke-muted-foreground"
              />
              Container Deploying
            </span>
          ) : (
            <span className="capitalize">
              {task.taskState ?? task.taskMessage ?? "unknown"}
            </span>
          )}
        </TableCell>

        <TableCell>{uptimeText ?? "N/A"}</TableCell>
        <TableCell>{mainContainer?.node ?? "unknown"}</TableCell>
        <TableCell>{mainContainer?.cpu?.toFixed(2) ?? "0.00"}%</TableCell>
        <TableCell>
          {prettyBytes(mainContainer?.usedMemory ?? 0)} /{" "}
          {prettyBytes(mainContainer?.totalMemory ?? 0)}
        </TableCell>
        <TableCell>
          {prettyBytes(mainContainer?.network?.rx ?? 0)} /{" "}
          {prettyBytes(mainContainer?.network?.tx ?? 0)}
        </TableCell>
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

      {container?.error !== undefined ||
      previous[0]?.container?.error !== undefined ? (
        <TableRow className="hover:bg-inherit">
          <TableCell></TableCell>
          <TableCell colSpan={8} className="mb-4 text-red-500">
            {container?.error
              ? "Container exited with:"
              : "Previous container exited with:"}{" "}
            <br />
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {container?.error ?? previous[0]?.container?.error}
            </pre>
            <br />
          </TableCell>
        </TableRow>
      ) : undefined}
    </>
  );
}
