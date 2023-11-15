"use client";

import { api } from "~/trpc/react";

export default function TestPage() {
  const { data } = api.system.currentStats.useQuery();

  return <div>CPU Usage: {data?.cpu.usage}</div>;
}
