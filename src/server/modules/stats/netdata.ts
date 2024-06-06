import type { GlobalStore } from "~/server/managers/GlobalContext";
import type { paths as NetdataAPI, components } from "./netdata-api";
import assert from "assert";
import { expectOrThrow } from "~/utils/utils";
import logger from "~/server/utils/logger";

type ExtractQueryParameters<T> = T extends { parameters: { query?: infer Q } }
  ? Q
  : never;

export class NetdataManager {
  private logger = logger.child({ module: "NetdataManager" });

  constructor(
    private config: GlobalStore,
    private netdataHost: string,
  ) {}

  public async getHistoricalContainerStats({ filter }: { filter: string }) {
    const data = (await this.call("/api/v2/data", {
      contexts: "cgroup.mem_usage_limit,cgroup.cpu_limit",
      instances: filter,
      group_by: ["instance"],
    })) as components["schemas"]["jsonwrap2"];

    const result = data.result as components["schemas"]["data_json2"];

    const labels = expectOrThrow(
      result.labels,
      "netdata did not return labels!",
    );

    const series = expectOrThrow(result.data, "netdata did not return series!");

    const datapoints: Record<
      string,
      {
        cpu: [number, number][];
        memory: [number, number][];
      }
    > = {};

    // parse the labels - https://regex101.com/r/vLLAhv/1
    // sample data:
    //   cgroup_test-project_pocketbase-1-9g0lwp1h29l6ifb2jdnxhbnqa.mem_usage_limit@5ee164e8-23a4-11ef-bf48-02420a00008c
    //   cgroup_test-project_netdata-central-1-l658hqvksrvtcv68oubw648pc.mem_usage_limit@5ee164e8-23a4-11ef-bf48-02420a00008c
    const labelRegex =
      /^cgroup_(?<container>[\w-]+?).(?<type>mem_usage_limit|cpu_limit)@(?<host>.*)$/;
    const parsedLabels = labels.map((label) => {
      const match = label.match(labelRegex);
      assert(match, `label ${label} did not match regex`);

      return {
        container: expectOrThrow(
          match.groups?.container,
          "malformed data from netdata (missing container)",
        ),
        type: expectOrThrow(
          match.groups?.type,
          "malformed data from netdata (missing type)",
        ),
        host: expectOrThrow(
          match.groups?.host,
          "malformed data from netdata (missing host)",
        ),
        raw: label,
      };
    });

    for (const entry of series) {
      const t = entry[0] as number;

      for (let i = 0; i < labels.length; i++) {
        const label = parsedLabels[i];
        if (!label) {
          this.logger.warn(`label for index ${i} not found in parsedLabels`);
          continue;
        }

        const existingValues = (datapoints[label.container] ??= {
          cpu: [],
          memory: [],
        });

        const data = (entry[i + 1] as [number, number, number])?.[1];
        if (data === undefined) {
          this.logger.warn(
            `data for label ${label.raw} not found in entry ${entry}`,
          );
          continue;
        }

        if (label.type === "cpu_limit") {
          existingValues.cpu.push([t, data]);
        }
        if (label.type === "mem_usage_limit") {
          existingValues.memory.push([t, data]);
        }
      }
    }

    return datapoints;
  }

  // public async getHistoricalSystemStats() {

  // }

  private async call<T extends keyof NetdataAPI>(
    route: T,
    query?: ExtractQueryParameters<NetdataAPI[T]["get"]>,
  ): Promise<
    NetdataAPI[T]["get"]["responses"][200]["content"]["application/json"]
  > {
    // concat route to netdata host
    const url = new URL(route, this.netdataHost);
    // add query parameters
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        let stringValue: string | undefined = undefined;

        if (typeof value === "string") {
          stringValue = value;
        } else if (Array.isArray(value)) {
          stringValue = value.join(",");
        } else if (typeof value === "object") {
          stringValue = JSON.stringify(value);
        }

        if (stringValue) {
          url.searchParams.append(key, stringValue);
        }
      });
    }

    const response = await fetch(url.toString());
    return response.json() as Promise<
      NetdataAPI[T]["get"]["responses"][200]["content"]["application/json"]
    >;
  }
}
