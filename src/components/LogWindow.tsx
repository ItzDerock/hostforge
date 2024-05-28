"use client";

import Ansi from "ansi-to-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "~/utils/utils";
import { Checkbox } from "./ui/checkbox";

export enum LogLevel {
  /**
   * Command Stdout
   */
  Stdout,

  /**
   * Command Stderr
   */
  Stderr,

  /**
   * Messages that did not originate from the command
   */
  Notice,
}

export type LogLine = {
  t?: number;
  m: string;
  l: LogLevel;
};

const LOG_LEVEL_TO_CLASS = {
  [LogLevel.Stdout]: "",
  [LogLevel.Stderr]: "bg-red-950/40",
  [LogLevel.Notice]: "bg-blue-950/40",
};

export function LogWindow({
  logs,
  supressStderr,
  className,
}: {
  logs: LogLine[];
  supressStderr?: boolean;
  className?: string;
}) {
  const timestampsAvailable = useMemo(() => logs.some((log) => log.t), [logs]);
  const divRef = useRef<HTMLDivElement>(null);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // autoscroll when option changes
  useEffect(() => {
    if (autoScroll) {
      divRef.current?.scrollTo(0, divRef.current.scrollHeight);
    }
  }, [autoScroll, logs]);

  return (
    <div
      className={cn("flex flex-col rounded-xl bg-card p-4 text-sm", className)}
    >
      <div className="flex flex-row gap-4 pb-2 text-white">
        <div className="flex flex-row align-middle">
          <Checkbox
            checked={autoScroll}
            onCheckedChange={(value) =>
              value !== "indeterminate" && setAutoScroll(value)
            }
            aria-label="Autoscroll"
            id="autoscroll"
          />

          <label htmlFor="autoscroll" className="ml-1 leading-[1.2]">
            Autoscroll
          </label>
        </div>

        {timestampsAvailable && (
          <div className="flex flex-row align-middle">
            <Checkbox
              checked={showTimestamps}
              onCheckedChange={(value) =>
                value !== "indeterminate" && setShowTimestamps(value)
              }
              aria-label="Show timestamps"
              id="show-timestamps"
            />

            <label htmlFor="show-timestamps" className="ml-1 leading-[1.2]">
              Show timestamps
            </label>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-auto" ref={divRef}>
        {/* logs */}
        <table className="h-full w-full text-white">
          <tbody>
            {logs.map((log, i) => (
              <tr
                key={i}
                className={`${
                  supressStderr && log.l === LogLevel.Stderr
                    ? LOG_LEVEL_TO_CLASS[LogLevel.Stdout]
                    : LOG_LEVEL_TO_CLASS[log.l]
                } hover:bg-black/20`}
              >
                {showTimestamps && (
                  <td className="select-none whitespace-nowrap align-top text-gray-300">
                    {log.t ? new Date(log.t).toLocaleTimeString() : ""}
                  </td>
                )}

                {
                  <td className="w-full whitespace-pre-wrap pl-2">
                    <Ansi>{log.m}</Ansi>
                  </td>
                }
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="mt-4 text-center text-gray-500">No logs</div>
        )}
      </div>
    </div>
  );
}
