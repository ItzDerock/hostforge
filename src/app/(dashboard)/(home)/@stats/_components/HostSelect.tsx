"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { StringParam, useQueryParam } from "use-query-params";
import type { RouterOutputs } from "~/trpc/shared";

export function HostSelect({
  hosts,
}: {
  hosts: RouterOutputs["system"]["hosts"];
}) {
  const [hostId, setHostId] = useQueryParam("host", StringParam);
  const mainNode = hosts.find((node) => node.isMainNode);

  return (
    <Select
      onValueChange={setHostId}
      value={hostId ?? mainNode?.id ?? undefined}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={mainNode?.name ?? "Main Node"} />
      </SelectTrigger>
      <SelectContent>
        {hosts.map((node) => (
          <SelectItem
            key={node.id}
            value={node.id}
            disabled={!node.statsAvailable}
          >
            {node.name} {node.isMainNode ? "*" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
