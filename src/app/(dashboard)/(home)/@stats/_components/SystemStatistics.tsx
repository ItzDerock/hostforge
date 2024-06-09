"use client";

import { useMemo, useState } from "react";
import { Cpu, HardDrive, MemoryStick, Router } from "lucide-react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { StatCard } from "./StatCard";
import { StringParam, useQueryParam } from "use-query-params";

type StatData = RouterOutputs["system"]["currentStats"];
type HistoricalStatData = RouterOutputs["system"]["history"];
type Hosts = RouterOutputs["system"]["hosts"];

export function SystemStatistics(props: {
  initialData: StatData;
  historicalData: HistoricalStatData;
  hosts: Hosts;
}) {
  const mainNode = props.hosts.find((node) => node.isMainNode);
  const [hostId] = useQueryParam("host", StringParam);
  const [data, setData] = useState<StatData>(props.initialData);

  api.system.liveStats.useSubscription(undefined, {
    onData: (data) => {
      setData(data);
    },
  });

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {/* <motion.div layoutId="cpuUsage" onClick={() => setSelected("cpuUsage")}> */}
      <StatCard
        title="CPU Usage"
        value={data.cpu.usage}
        unit="%"
        subvalue={`of ${data.cpu.cores} CPUs`}
        icon={Cpu}
        data={props.historicalData.cpu}
        dataKey="value"
      />
      {/* </motion.div> */}

      <StatCard
        title="Memory Usage"
        value={data.memory.used / data.memory.total}
        unit="%"
        subvalue={`${data.memory.used.toFixed(2)} / ${data.memory.total.toFixed(
          2,
        )} GB`}
        icon={MemoryStick}
        data={props.historicalData.usedMemory}
        dataKey="value"
      />

      <StatCard
        title="Disk Usage"
        value={data.storage.used / data.storage.total}
        unit="%"
        subvalue={`${data.storage.used.toFixed(
          2,
        )} / ${data.storage.total.toFixed(2)} GB`}
        icon={HardDrive}
        data={props.historicalData.usedDisk}
        dataKey="value"
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
        icon={Router}
        data={props.historicalData.networkTransmit}
        dataKey="value"
      />
    </div>
  );
}
