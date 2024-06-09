import { PrometheusDriver, type Target } from "prometheus-query";
import type { GlobalStore } from "~/server/managers/GlobalContext";

export class Prometheus {
  static readonly QUERIES = [
    [
      "cpu",
      `(((count(count(node_cpu_seconds_total{docker_node_id="$node"}) by (cpu))) - avg(sum by (mode)(rate(node_cpu_seconds_total{mode='idle',docker_node_id="$node"}[5m])))) * 100) / count(count(node_cpu_seconds_total{docker_node_id="$node"}) by (cpu))`,
    ],
    [
      "usedMemory",
      `node_memory_MemTotal_bytes{docker_node_id="$node"} - node_memory_MemFree_bytes{docker_node_id="$node"}`,
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

  private queryClient: PrometheusDriver;

  constructor(
    private readonly store: GlobalStore,
    readonly prometheusHost: string,
  ) {
    this.queryClient = new PrometheusDriver({
      endpoint: this.prometheusHost,
    });
  }

  public async getHistoricalSystemStats({
    start,
    end,
    instance,
  }: {
    start?: number;
    end?: number;
    instance: string;
  }) {
    if (!start) start = Date.now() - 1000 * 60 * 60 * 24; // 24 hours

    return (
      await Promise.all(
        Prometheus.QUERIES.map(async ([name, q]) => {
          // replace $node with instance
          const query = q.replace(/\$node/g, instance);

          return {
            name,
            data: await this.queryClient
              .rangeQuery(query, start!, end ?? Date.now(), "1m")
              .then((res) => res.result as [{ values: [number, string][] }]),
          };
        }),
      )
    ).reduce(
      (acc, { name, data }) => ({
        ...acc,
        [name]: data[0].values,
      }),
      {} as Record<
        (typeof Prometheus.QUERIES)[number][0],
        { time: string; data: number }[]
      >,
    );
  }

  public async getNodes() {
    return (
      this.queryClient.targets("active") as Promise<{
        activeTargets: Target[];
        droppedTargets: Target[];
      }>
    ).then((res) => {
      return res.activeTargets.map((target) => {
        const labels = target.discoveredLabels as Record<
          string,
          string | undefined
        >;

        return {
          id: labels.__meta_dockerswarm_node_id,
          lastScrape: target.lastScrape,
          lastError: target.lastError,
          url: target.scrapeUrl,
          job: labels.__meta_dockerswarm_container_label_prometheus_job,
        };
      });
    });
  }
}

export interface Metrics {
  metric: {
    __name__: string;
    docker_node_id: string;
    instance: string;
    job: string;
  };

  values: [number, string][];
}
