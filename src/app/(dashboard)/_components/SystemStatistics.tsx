"use client";

import { useMemo, useState } from "react";
import {
  FaEthernet,
  FaHardDrive,
  FaMemory,
  FaMicrochip,
} from "react-icons/fa6";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { StatCard } from "./StatCard";

type StatData = RouterOutputs["system"]["currentStats"];
type HistoricalStatData = RouterOutputs["system"]["history"];

export function SystemStatistics(props: {
  initialData: StatData;
  historicalData: HistoricalStatData;
}) {
  const [data, setData] = useState<StatData>(props.initialData);
  // const [selectedId, setSelected] = useState<string | null>(null);

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
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {/* <motion.div layoutId="cpuUsage" onClick={() => setSelected("cpuUsage")}> */}
      <StatCard
        title="CPU Usage"
        value={data.cpu.usage}
        unit="%"
        subvalue={`of ${data.cpu.cores} CPUs`}
        icon={FaMicrochip}
        data={historicalData}
        dataKey="cpuUsage"
      />
      {/* </motion.div> */}

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

      {/* animations soon™️ */}
      {/* <AnimatePresence>
        {selectedId && (
          <motion.div
            layoutId={selectedId}
            className="fixed inset-0 z-50 bg-black/40 p-8"
          >
            <StatCard
              title="CPU Usage"
              value={data.cpu.usage}
              unit="%"
              subvalue={`of ${data.cpu.cores} CPUs`}
              icon={FaMicrochip}
              data={historicalData}
              dataKey="cpuUsage"
              type="fullscreen"
            />
          </motion.div>
        )}
      </AnimatePresence> */}
    </div>
  );
}
