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
