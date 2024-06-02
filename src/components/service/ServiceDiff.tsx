// import { type RouterOutputs } from "~/trpc/shared";
import { Operation, type IChange } from "json-diff-ts";
import { Badge } from "../ui/badge";
import {
  DockerDeployMode,
  DockerRestartCondition,
  ServiceBuildMethod,
  ServiceSource,
} from "~/server/db/types";
import { EnumObject } from "~/utils/utils";
import { reportUnusedDisableDirectives } from ".eslintrc.cjs";

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
      <>
        {diff.map((change, i) => (
          <ServiceDiff key={i} diff={change} />
        ))}
      </>
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
          {diff.type}
        </Badge>
      </div>
      <div className="whitespace-pre-wrap text-center text-muted-foreground">
        {diff.type == Operation.UPDATE && (
          <>
            <Formatted>{formatValue(diff.key, diff.oldValue)}</Formatted>
            <p className="my-1">Updated to</p>
          </>
        )}
        <Formatted>{formatValue(diff.key, diff.value)}</Formatted>
      </div>
    </div>
  );
}

export function formatValue(key: string, value: unknown) {
  return (
    replaceWithEnumName(key, "deployMode", DockerDeployMode, value) ??
    replaceWithEnumName(key, "buildMethod", ServiceBuildMethod, value) ??
    replaceWithEnumName(key, "source", ServiceSource, value) ??
    replaceWithEnumName(key, "restart", DockerRestartCondition, value) ??
    JSON.stringify(value)
  );
}

function replaceWithEnumName<T extends EnumObject<T>>(
  key: string,
  field: string,
  nativeEnum: T,
  value: unknown,
) {
  if (key === field && typeof value === "number" && value in nativeEnum) {
    return nativeEnum[value];
  }

  return null;
}
