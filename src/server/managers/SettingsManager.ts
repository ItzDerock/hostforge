import assert from "assert";
import type { Database } from "../db";
import { instanceSettings } from "../db/schema";
import { eq } from "drizzle-orm";
import logger from "../utils/logger";
import { randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";

type InstanceSettings = Omit<typeof instanceSettings.$inferSelect, "id">;

export default class SettingsManager {
  private static INSTANCE_ID = parseInt(process.env.CUSTOM_INSTANCE_ID ?? "1");
  private static instance: SettingsManager | null = null;
  private isSetup = false;

  public static async createInstance(db: Database) {
    if (this.instance == null) {
      const [data] = await db
        .select()
        .from(instanceSettings)
        .where(eq(instanceSettings.id, SettingsManager.INSTANCE_ID));

      this.instance = new SettingsManager(db, data ?? null);
    }

    return this.instance;
  }

  public static getInstance() {
    assert(
      this.instance !== null,
      new TRPCError({
        message: "Instance not set up yet.",
        code: "UNPROCESSABLE_CONTENT", // cant return 503 since trpc doesn't support
      }), // this should probably be handled at trpc level
    );
    return this.instance;
  }

  private constructor(
    private db: Database,
    private settings: InstanceSettings | null,
  ) {
    if (settings) {
      this.isSetup = true;
    }
  }

  public getSettings() {
    assert(this.settings !== null, "Instance not set up yet.");
    assert(this.settings !== undefined, "Settings not loaded yet.");

    return this.settings;
  }

  public async updateSettings(newSettings: Partial<InstanceSettings>) {
    const [result] = await this.db
      .update(instanceSettings)
      .set(newSettings)
      .where(eq(instanceSettings.id, SettingsManager.INSTANCE_ID))
      .returning();

    assert(result !== undefined, "Failed to update settings.");
    return (this.settings = result);
  }

  public async setupInstance(
    initialSettings: Omit<InstanceSettings, "sessionSecret">,
  ) {
    const sessionSecret = randomBytes(64).toString("hex");
    logger.info(`Generated session secret: ${sessionSecret.slice(0, 6)}...`);

    const [result] = await this.db
      .insert(instanceSettings)
      .values({
        ...initialSettings,
        id: SettingsManager.INSTANCE_ID,
        sessionSecret,
      })
      .returning();

    assert(result !== undefined, "Failed to set up instance.");
    this.isSetup = true;
    return (this.settings = result);
  }

  public isInstanceSetup() {
    return this.settings !== null;
  }

  public waitForSetup() {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (this.isSetup) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }
}
