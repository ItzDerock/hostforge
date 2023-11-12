"use client";

import { api } from "~/trpc/react";
import { StatCard } from "./StatCard";
import { RouterOutputs } from "~/trpc/shared";
import {
  FaMicrochip,
  FaMemory,
  FaHardDrive,
  FaEthernet,
} from "react-icons/fa6";
import { useState } from "react";

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

type StatData = RouterOutputs["system"]["currentStats"];

export function SystemStatistics(props: { initialData: StatData }) {
  const [data, setData] = useState<StatData>(props.initialData);

  api.system.liveStats.useSubscription(undefined, {
    onData: (data) => {
      setData(data);
    },
  });

  return (
    <div className="m-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="CPU Usage"
        value={data.cpu.usage}
        unit="%"
        subvalue={`of ${data.cpu.cores} CPUs`}
        icon={FaMicrochip}
        data={TEST_DATA}
        dataKey="cpu"
      />

      <StatCard
        title="Memory Usage"
        value={data.memory.used / data.memory.total}
        unit="%"
        subvalue={`${data.memory.used.toFixed(2)} / ${data.memory.total.toFixed(
          2,
        )} GB`}
        icon={FaMemory}
        data={TEST_DATA}
        dataKey="cpu"
      />

      <StatCard
        title="Disk Usage"
        value={data.storage.used / data.storage.total}
        unit="%"
        subvalue={`${data.storage.used.toFixed(
          2,
        )} / ${data.storage.total.toFixed(2)} GB`}
        icon={FaHardDrive}
        data={TEST_DATA}
        dataKey="cpu"
      />

      <StatCard
        title="Network Usage"
        // TX
        value={data.network.tx}
        // unit="Mbps"
        subvalue="Mbps / TX"
        // RX
        secondaryValue={data.network.rx}
        // secondaryUnit="Mbps"
        secondarySubvalue="RX / Mbps"
        // misc
        icon={FaEthernet}
        data={TEST_DATA}
        dataKey="cpu"
      />
    </div>
  );
}
