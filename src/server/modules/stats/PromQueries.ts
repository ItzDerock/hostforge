export const HISTORY_QUERIES = [
  [
    "cpu",
    `(((count(count(node_cpu_seconds_total{docker_node_id="$node"}) by (cpu))) - avg(sum by (mode)(rate(node_cpu_seconds_total{mode='idle',docker_node_id="$node"}[5m])))) * 100) / count(count(node_cpu_seconds_total{docker_node_id="$node"}) by (cpu))`,
  ],
  [
    "usedMemory",
    `node_memory_MemTotal_bytes{docker_node_id="$node"} - node_memory_MemAvailable_bytes{docker_node_id="$node"}`,
  ],
  ["totalMemory", `node_memory_MemTotal_bytes{docker_node_id="$node"}`],
  [
    "usedDisk",
    `node_filesystem_size_bytes{device!~'rootfs',docker_node_id="$node"} - node_filesystem_avail_bytes{device!~'rootfs',docker_node_id="$node"}`,
  ],
  [
    "totalDisk",
    `node_filesystem_size_bytes{device!~'rootfs',docker_node_id="$node"}`,
  ],
  [
    "networkReceive",
    `sum by (instance)(irate(node_network_receive_bytes_total{docker_node_id="$node"}[5m]))`,
  ],
  [
    "networkTransmit",
    `sum by (instance)(irate(node_network_transmit_bytes_total{docker_node_id="$node"}[5m]))`,
  ],
] as const;

export const CURRENT_STATS_QUERIES = [
  ...HISTORY_QUERIES,
  [
    "cpuCores",
    `count without(cpu, mode) (node_cpu_seconds_total{mode="idle",docker_node_id="$node"})`,
  ],
] as const;
