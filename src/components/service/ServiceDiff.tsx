// import { type RouterOutputs } from "~/trpc/shared";
import type { IChange } from "json-diff-ts";
import { Badge } from "../ui/badge";
import { ArrowDown } from "lucide-react";

function Formatted({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ServiceDiff({ diff }: { diff: IChange[] | IChange }) {
  if (Array.isArray(diff)) {
    return (
      <div>
        {diff.map((change, i) => (
          <ServiceDiff key={i} diff={change} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2 items-center gap-4 rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="mb-1 flex flex-row font-medium text-white">
        <span>{diff.key}</span>

        <Badge
          className="ml-auto mr-0 box-content bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-400"
          variant="outline"
        >
          Updated
        </Badge>
      </div>
      <div className="whitespace-pre-wrap text-center text-muted-foreground">
        <Formatted>{diff.oldValue}</Formatted>
        <p className="my-1">Updated to</p>
        <Formatted>{diff.value}</Formatted>
      </div>
    </div>
  );
}
