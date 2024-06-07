import { env } from "~/env";
import { SessionStore } from "../auth/SessionStore";
import type { Database } from "../db";
import { TraefikManager } from "../docker/traefik";
import { NetdataManager } from "../modules/stats/netdata";
import type SettingsManager from "./SettingsManager";
import { NetworkManager } from "../modules/internal/InternalNetworks";
import type { Docker } from "../docker/docker";

export class GlobalStore {
  public readonly sessions: SessionStore;
  public readonly internalServices: {
    networks: NetworkManager;
    traefik: TraefikManager;
    netdata: NetdataManager;
  };

  constructor(
    public readonly db: Database,
    public readonly settings: SettingsManager,
    public readonly docker: Docker,
  ) {
    this.sessions = new SessionStore(db, this);
    this.internalServices = {
      networks: new NetworkManager(this, docker),
      traefik: new TraefikManager(this),
      netdata: new NetdataManager(this, env.NETDATA_URL),
    };
  }
}
