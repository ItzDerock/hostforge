"use client";
import formatRelative from "date-fns/formatRelative";

export function RelativeDate({ date }: { date: Date }) {
  return formatRelative(date, new Date());
}
