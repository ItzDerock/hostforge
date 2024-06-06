import { env } from "~/env";
import { SessionStore } from "../auth/SessionStore";
import type { Database } from "../db";
import { TraefikManager } from "../docker/traefik";
import { NetdataManager } from "../modules/stats/netdata";
import type SettingsManager from "./SettingsManager";

export class GlobalStore {
  public readonly sessions: SessionStore;
  public readonly traefik: TraefikManager;
  public readonly netdata: NetdataManager;

  constructor(
    public readonly db: Database,
    public readonly settings: SettingsManager,
  ) {
    this.sessions = new SessionStore(db, this);
    this.traefik = new TraefikManager(this);
    this.netdata = new NetdataManager(this, env.NETDATA_HOST);
  }
}
