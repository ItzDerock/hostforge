"use client";
import { formatRelative } from "date-fns/formatRelative";

/**
 * A component that displays a relative date.
 * @param date The date to display.
 */
export function RelativeDate({ date }: { date: Date }) {
  return formatRelative(date, new Date());
}

/**
 * A component that displays an absolute date.
 */
export function AbsoluteDate({ date }: { date: Date }) {
  return date.toLocaleString();
}
