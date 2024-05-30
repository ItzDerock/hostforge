import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type Awaitable<T> = T | Promise<T>;

export function isDefined<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  return value !== null && value !== undefined;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * If the string is empty, return the "or" value, otherwise return the string.
 */
export const emptyStringIs = <T>(str: string, or: T) => (str === "" ? or : str);

export function renderServiceHealth(opts: {
  DesiredTasks?: number;
  RunningTasks?: number;
  CompletedTasks?: number;
}) {
  const successCount = (opts.RunningTasks ?? 0) + (opts.CompletedTasks ?? 0);
  const status =
    successCount >= (opts.DesiredTasks ?? 0) ? "Healthy" : "Unhealthy";

  return `${status} - ${successCount}/${opts.DesiredTasks}`;
}
