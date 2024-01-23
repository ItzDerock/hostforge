"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ClipboardIcon } from "lucide-react";
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
  data: { container, previous, task, slot },
}: {
  data: RouterOutputs["projects"]["services"]["containers"]["latest"][number];
}) {
  const mainContainer = container ?? previous[0]?.container;
  const isRedeploying = container === undefined;

  return (
    <>
      <TableRow key={slot}>
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
              Redeploying
              {previous[0]?.container?.error && (
                <span>
                  {" "}
                  (previous container errored with:{" "}
                  {previous[0]?.container?.error})
                </span>
              )}
            </span>
          ) : (
            task.taskState ?? task.taskMessage ?? "unknown"
          )}

          {container?.error && (
            <span className="text-red-500">
              {" "}
              (errored with: {container.error})
            </span>
          )}
        </TableCell>
        <TableCell>{mainContainer?.node ?? "unknown"}</TableCell>
        <TableCell>
          {formatDistanceToNowStrict(mainContainer?.containerCreatedAt ?? 0)}
        </TableCell>
        <TableCell>{mainContainer?.cpu ?? "?"}</TableCell>
        <TableCell>{mainContainer?.memory ?? "?"}</TableCell>
        <TableCell>
          {mainContainer?.network?.rx ?? "N/A"} /{" "}
          {mainContainer?.network?.tx ?? "N/A"}
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
    </>
  );
}
