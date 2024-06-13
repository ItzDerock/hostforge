import { env } from "~/env";
import { SessionStore } from "../auth/SessionStore";
import type { Database } from "../db";
import { TraefikManager } from "../docker/traefik";
import type SettingsManager from "./SettingsManager";
import { NetworkManager } from "../modules/internal/InternalNetworks";
import type { Docker } from "../docker/docker";
import { Prometheus } from "../modules/stats/Prometheus";
import { BuildManager } from "../build/BuildManager";

export class GlobalStore {
  public readonly sessions: SessionStore;
  public readonly builder: BuildManager;
  public readonly internalServices: {
    networks: NetworkManager;
    traefik: TraefikManager;
    prometheus: Prometheus;
  };

  constructor(
    public readonly db: Database,
    public readonly settings: SettingsManager,
    public readonly docker: Docker,
  ) {
    this.sessions = new SessionStore(db, this);
    this.builder = new BuildManager(this);
    this.internalServices = {
      networks: new NetworkManager(this, docker),
      traefik: new TraefikManager(this),
      prometheus: new Prometheus(this, env.PROMETHEUS_URL),
    };
  }
}
