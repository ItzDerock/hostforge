import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type Awaitable<T> = T | Promise<T>;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
