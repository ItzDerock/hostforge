import { PrometheusDriver, type Target } from "prometheus-query";
import type { GlobalStore } from "~/server/managers/GlobalContext";
import { PrometheusStack } from "./PrometheusStack";
import { CURRENT_STATS_QUERIES, HISTORY_QUERIES } from "./PromQueries";

export class Prometheus {
  private queryClient: PrometheusDriver;
  public readonly stack: PrometheusStack;

  constructor(
    private readonly store: GlobalStore,
    readonly prometheusHost: string,
  ) {
    this.stack = new PrometheusStack(store);
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
    return this.runRangeQueries(
      HISTORY_QUERIES,
      { node: instance },
      start,
      end,
    );
  }

  public async getCurrentSystemStats({ instance }: { instance: string }) {
    return this.runInstantQueries(CURRENT_STATS_QUERIES, {
      node: instance,
    });
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

  private async runInstantQueries<
    T extends readonly (readonly [string, string])[],
  >(queries: T, replacements: Record<string, string>) {
    return (
      await Promise.all(
        queries.map(async ([name, q]) => {
          // replace $node with instance
          const query = Object.entries(replacements).reduce(
            (acc, [key, value]) =>
              acc.replace(new RegExp(`\\$${key}`, "g"), value),
            q,
          );
          const data = await this.queryClient.instantQuery(query);

          return {
            name,
            data: data.result[0] as InstantResult,
          };
        }),
      )
    ).reduce(
      (acc, { name, data }) => ({
        ...acc,
        [name]: data.value,
      }),
      {} as Record<T[number][0], { time: string; value: number }>,
    );
  }

  private async runRangeQueries<
    T extends readonly (readonly [string, string])[],
  >(
    queries: T,
    replacements: Record<string, string>,
    start: number,
    end?: number,
  ) {
    return (
      await Promise.all(
        queries.map(async ([name, q]) => {
          // replace $node with instance
          const query = Object.entries(replacements).reduce(
            (acc, [key, value]) =>
              acc.replace(new RegExp(`\\$${key}`, "g"), value),
            q,
          );
          const data = await this.queryClient.rangeQuery(
            query,
            start,
            end ?? Date.now(),
            "1m",
          );

          return {
            name,
            data: data.result as { time: string; data: number }[],
          };
        }),
      )
    ).reduce(
      (acc, { name, data }) => ({
        ...acc,
        [name]: data,
      }),
      {} as Record<T[number][0], { time: string; data: number }[][]>,
    );
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

interface InstantResult {
  metric: {
    labels: Record<string, string>;
  };

  value: {
    time: string;
    value: number;
  };
}
