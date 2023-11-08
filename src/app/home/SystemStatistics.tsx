"use client";

import { api } from "~/trpc/react";
import { StatCard } from "./StatCard";
import { RouterOutputs } from "~/trpc/shared";
import { RiPulseFill } from "react-icons/ri";

const TEST_DATA = [
  { cpu: 0.05 },
  { cpu: 0.1 },
  { cpu: 0.08 },
  { cpu: 0.09 },
  { cpu: 0.2 },
  { cpu: 0.1 },
  { cpu: 0.12 },
  { cpu: 0.3 },
];

export function SystemStatistics(props: {
  initialData: RouterOutputs["system"]["current"];
}) {
  const { data } = api.system.current.useQuery(undefined, {
    initialData: props.initialData,
    refetchInterval: 5_000,
  });

  return (
    <div className="m-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="CPU Usage"
        value={`${data.cpu.usage ?? 0}%`}
        subvalue={`of ${data.cpu.cores} CPUs`}
        icon={RiPulseFill}
        data={TEST_DATA}
        dataKey="cpu"
      />

      <StatCard
        title="Memory Usage"
        value={`${((data.memory.used / data.memory.total) * 100).toFixed(2)}%`}
        subvalue={`${data.memory.used.toFixed(2)} / ${data.memory.total.toFixed(
          2,
        )} GB`}
        icon={RiPulseFill}
        data={TEST_DATA}
        dataKey="cpu"
      />

      <StatCard
        title="Disk Usage"
        value={`${((data.storage.used / data.storage.total) * 100).toFixed(
          2,
        )}%`}
        subvalue={`${data.storage.used.toFixed(
          2,
        )} / ${data.storage.total.toFixed(2)} GB`}
        icon={RiPulseFill}
        data={TEST_DATA}
        dataKey="cpu"
      />
      {/* <StatCard />
      <StatCard />
      <StatCard /> */}
    </div>
  );
}
