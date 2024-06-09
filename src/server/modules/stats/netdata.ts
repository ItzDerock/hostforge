import type { GlobalStore } from "~/server/managers/GlobalContext";
import type { paths as NetdataAPI, components } from "./netdata-api";
import { expectOrThrow } from "~/utils/utils";
import logger from "~/server/utils/logger";
import { NetdataServiceManager } from "./NetdataService";

type ExtractQueryParameters<T> = T extends { parameters: { query?: infer Q } }
  ? Q
  : never;

export class NetdataManager {
  private static CONTAINER_LABEL_REGEX =
    /^cgroup_(?<container>[\w-]+?).(?<type>mem_usage_limit|cpu_limit)@(?<host>.*)$/;
  private static GENERAL_LABEL_REGEX = /^(?<type>[\w\-.]+)@(?<host>.*)$/;
  private logger = logger.child({ module: "NetdataManager" });
  public readonly serviceManager: NetdataServiceManager;

  constructor(
    private config: GlobalStore,
    private netdataHost: string,
  ) {
    this.serviceManager = new NetdataServiceManager(config);
  }

  public async getHistoricalSystemStats() {
    const data = (await this.call("/api/v2/data", {
      contexts: "system.cpu,system.ram,disk.space,system.net",
      after: 24 * 60 * 60 /* 24 hours in seconds */,
      points: 20,
      group_by: ["instance"],
    })) as components["schemas"]["jsonwrap2"];

    const result = data.result as components["schemas"]["data_json2"];

    const labels = this.parseLabels(
      expectOrThrow(result.labels, "netdata did not return labels!"),
    );

    const series = expectOrThrow(result.data, "netdata did not return series!");

    return {
      labels,
      series,
    };
  }

  public async getNodes() {
    return expectOrThrow(
      (await this.call("/api/v2/nodes")).nodes,
      "netdata did not return nodes!",
    );
  }

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

  private parseLabels(labels: string[]) {
    // parse the labels - https://regex101.com/r/vLLAhv/1
    // sample data:
    //   cgroup_test-project_pocketbase-1-9g0lwp1h29l6ifb2jdnxhbnqa.mem_usage_limit@5ee164e8-23a4-11ef-bf48-02420a00008c
    //   cgroup_test-project_netdata-central-1-l658hqvksrvtcv68oubw648pc.mem_usage_limit@5ee164e8-23a4-11ef-bf48-02420a00008c
    return labels.map((label) => {
      const match = label.match(NetdataManager.CONTAINER_LABEL_REGEX);
      if (!match) {
        const generalMatch = label.match(NetdataManager.GENERAL_LABEL_REGEX);
        if (!generalMatch) {
          return {
            container: "unknown",
            type: label,
            host: "unknown",
            raw: label,
          };
        }

        return {
          container: "unknown",
          type: expectOrThrow(
            generalMatch.groups?.type,
            "malformed data from netdata (missing type)",
          ),
          host: expectOrThrow(
            generalMatch.groups?.host,
            "malformed data from netdata (missing host)",
          ),
          raw: label,
        };
      }

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
  }
}
