import { SessionStore } from "../auth/SessionStore";
import type { Database } from "../db";
import type SettingsManager from "./SettingsManager";

export class GlobalStore {
  public readonly sessions: SessionStore;

  constructor(
    public readonly db: Database,
    public readonly settings: SettingsManager,
  ) {
    this.sessions = new SessionStore(db, this);
  }
}
