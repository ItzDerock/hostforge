import { clsx, type ClassValue } from "clsx";
import type { ServiceStatus } from "dockerode";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

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

export enum ServiceHealth {
  Healthy,
  Unhealthy,
  PartiallyHealthy,
  Unknown,
}

export const SERVICE_HEALTH_TO_TEXT = {
  [ServiceHealth.Healthy]: "Healthy",
  [ServiceHealth.Unhealthy]: "Unhealthy",
  [ServiceHealth.PartiallyHealthy]: "Partially Healthy",
  [ServiceHealth.Unknown]: "Unknown",
} as const;

export function renderServiceHealth(opts: {
  DesiredTasks?: number;
  RunningTasks?: number;
  CompletedTasks?: number;
}) {
  const successCount = (opts.RunningTasks ?? 0) + (opts.CompletedTasks ?? 0);
  const health = parseServiceHealth(opts);

  return `${SERVICE_HEALTH_TO_TEXT[health]} - ${successCount}/${opts.DesiredTasks}`;
}

export function parseServiceHealth(status: Partial<ServiceStatus> = {}) {
  if (
    status.RunningTasks === undefined ||
    status.DesiredTasks === undefined ||
    status.CompletedTasks === undefined
  )
    return ServiceHealth.Unknown;

  const successCount = status.RunningTasks + status.CompletedTasks;

  if (successCount >= status.DesiredTasks) return ServiceHealth.Healthy;
  if (successCount === 0) return ServiceHealth.Unhealthy;
  return ServiceHealth.PartiallyHealthy;
}

// `extends enum` isn't a thing, so we have to use this workaround
// https://github.com/microsoft/TypeScript/issues/30611
export type EnumValue<TEnum> = (TEnum[keyof TEnum] & number) | string;
export type EnumObject<TEnum> = {
  [k: number]: string;
  [k: string]: EnumValue<TEnum>;
};

export function zodEnumFromObjValues<K extends string>(
  obj: Record<string | number | symbol, K>,
): z.ZodEnum<[K, ...K[]]> {
  const [firstKey, ...otherKeys] = Object.values(obj);
  return z.enum([firstKey!, ...otherKeys]);
}
