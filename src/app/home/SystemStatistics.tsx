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
import { useMemo, useState } from "react";

type StatData = RouterOutputs["system"]["currentStats"];
type HistoricalStatData = RouterOutputs["system"]["history"];

export function SystemStatistics(props: {
  initialData: StatData;
  historicalData: HistoricalStatData;
}) {
  const [data, setData] = useState<StatData>(props.initialData);

  api.system.liveStats.useSubscription(undefined, {
    onData: (data) => {
      setData(data);
    },
  });

  const historicalData = useMemo(
    () =>
      props.historicalData.map((data) => ({
        ...data,
        network: data.networkTx + data.networkRx,
      })),
    [props.historicalData],
  );

  return (
    <div className="m-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="CPU Usage"
        value={data.cpu.usage}
        unit="%"
        subvalue={`of ${data.cpu.cores} CPUs`}
        icon={FaMicrochip}
        data={historicalData}
        dataKey="cpuUsage"
      />

      <StatCard
        title="Memory Usage"
        value={data.memory.used / data.memory.total}
        unit="%"
        subvalue={`${data.memory.used.toFixed(2)} / ${data.memory.total.toFixed(
          2,
        )} GB`}
        icon={FaMemory}
        data={historicalData}
        dataKey="memoryUsage"
      />

      <StatCard
        title="Disk Usage"
        value={data.storage.used / data.storage.total}
        unit="%"
        subvalue={`${data.storage.used.toFixed(
          2,
        )} / ${data.storage.total.toFixed(2)} GB`}
        icon={FaHardDrive}
        data={historicalData}
        dataKey="diskUsage"
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
        data={historicalData}
        dataKey="network"
      />
    </div>
  );
}
