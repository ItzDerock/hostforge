"use client";

import Ansi from "ansi-to-react";

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

export function LogWindow({ logs }: { logs: LogLine[] }) {
  return (
    <div className="h-full w-full select-text">
      {logs.map((log, i) => (
        <div
          key={i}
          className={`flex gap-2 py-1 text-sm ${LOG_LEVEL_TO_CLASS[log.l]}`}
        >
          <div className="mt-1 text-xs text-gray-400">
            {log.t ? new Date(log.t).toLocaleTimeString() : ""}
          </div>
          <div className="flex-1 whitespace-pre">
            <Ansi>{log.m}</Ansi>
          </div>
        </div>
      ))}
    </div>
  );
}
