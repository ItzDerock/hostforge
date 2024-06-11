import { join } from "path";
import type { GlobalStore } from "~/server/managers/GlobalContext";
import logger from "~/server/utils/logger";

export class PrometheusStack {
  static readonly STACK_FOLDER = join(process.cwd(), "assets/monitoring");
  private log = logger.child({ class: "prometheus" });

  constructor(private store: GlobalStore) {}

  async init() {
    this.log.debug("Deploying prometheus stack...");
    const output = await this.store.docker
      .cli(["stack", "deploy", "-c", "stack.yml", "--prune", "prometheus"], {
        cwd: PrometheusStack.STACK_FOLDER,
      })
      .catch((err) => {
        this.log.error("Failed to deploy prometheus stack", err);
        return false;
      });

    if (output !== false) this.log.debug("Prometheus stack deployed");
    return output;
  }
}
