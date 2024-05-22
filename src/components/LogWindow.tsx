"use client";

import Ansi from "ansi-to-react";
import { useMemo } from "react";

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
}: {
  logs: LogLine[];
  supressStderr?: boolean;
}) {
  const withTimestamp = useMemo(() => logs.some((log) => log.t), [logs]);

  return (
    <table className="h-full w-full text-sm">
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
            {withTimestamp && (
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
  );
}
