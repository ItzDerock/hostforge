"use client";

import { Cpu, HardDrive, MemoryStick, Router } from "lucide-react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { StatCard } from "./StatCard";
import prettyBytes from "pretty-bytes";

type StatData = RouterOutputs["system"]["currentStats"];
type HistoricalStatData = RouterOutputs["system"]["history"];
type Hosts = RouterOutputs["system"]["hosts"];

export function SystemStatistics(props: {
  initialData: StatData;
  historicalData: HistoricalStatData;
  hosts: Hosts;
  selectedHost: string;
}) {
  const { data } = api.system.currentStats.useQuery(
    {
      instance: props.selectedHost,
    },
    {
      refetchInterval: 5_000,
      initialData: props.initialData,
      enabled: true,
    },
  );

  const memoryUsed = prettyBytes(data.usedMemory.value, {
    locale: true,
    binary: true,
  });

  const memoryTotal = prettyBytes(data.totalMemory.value, {
    locale: true,
    binary: true,
  });

  const diskUsed = prettyBytes(data.usedDisk.value, {
    locale: true,
    binary: true,
  });

  const diskTotal = prettyBytes(data.totalDisk.value, {
    locale: true,
    binary: true,
  });

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {/* <motion.div layoutId="cpuUsage" onClick={() => setSelected("cpuUsage")}> */}
      <StatCard
        title="CPU Usage"
        value={data.cpu.value}
        unit="%"
        subvalue={`of ${data.cpuCores.value} CPUs`}
        icon={Cpu}
        data={props.historicalData.cpu}
        dataKey="value"
      />
      {/* </motion.div> */}

      <StatCard
        title="Memory Usage"
        value={data.usedMemory.value / data.totalMemory.value}
        unit="%"
        subvalue={`${memoryUsed} / ${memoryTotal}`}
        icon={MemoryStick}
        data={props.historicalData.usedMemory}
        dataKey="value"
      />

      <StatCard
        title="Disk Usage"
        value={data.usedDisk.value / data.totalDisk.value}
        unit="%"
        subvalue={`${diskUsed} / ${diskTotal}`}
        icon={HardDrive}
        data={props.historicalData.usedDisk}
        dataKey="value"
      />

      <StatCard
        title="Network Usage"
        // TX
        value={data.networkTransmit.value}
        // unit="Mbps"
        subvalue="Mbps / TX"
        // RX
        secondaryValue={data.networkReceive.value}
        // secondaryUnit="Mbps"
        secondarySubvalue="RX / Mbps"
        // misc
        icon={Router}
        data={props.historicalData.networkTransmit}
        dataKey="value"
      />
    </div>
  );
}
