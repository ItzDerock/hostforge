import { between, count, lte } from "drizzle-orm";
import EventEmitter from "events";
import osu from "node-os-utils";
import os from "os";
import type TypedEmitter from "typed-emitter";
import { db } from "~/server/db";
import { systemStats } from "~/server/db/schema";
import baseLogger from "../../utils/logger";

export type BasicServerStats = {
  collectedAt: Date;

  cpu: {
    /**
     * The CPU usage, each core = 100%.
     * In decimal form, so 0.5 = 50%.
     */
    usage: number;

    /**
     * The number of cores the CPU has.
     */
    cores: number;
  };

  storage: {
    /**
     * The amount of storage used in GB.
     */
    used: number;

    /**
     * The total amount of storage in GB.
     */
    total: number;
  };

  memory: {
    /**
     * The amount of memory used in GB.
     */
    used: number;

    /**
     * The total amount of memory in GB.
     */
    total: number;
  };

  network: {
    /**
     * The tx (upload) speed in bytes per second.
     */
    tx: number;

    /**
     * The rx (download) speed in bytes per second.
     */
    rx: number;
  };
};

type StatEvents = {
  /**
   * Whenever new stats are collected
   * @param stats The new stats.
   * @returns
   */
  onUpdate: (stats: BasicServerStats) => void;

  /**
   * Built-in Node.JS event, emitted whenever a new listener is added.
   */
  newListener: (
    event: string | symbol,
    listener: (...args: unknown[]) => void,
  ) => void;

  /**
   * Built-in Node.JS event, emitted whenever a listener is removed.
   */
  removeListener: (
    event: string | symbol,
    listener: (...args: unknown[]) => void,
  ) => void;
};

/**
 * Manages the stats for the current server.
 */
export class StatManager {
  static readonly DB_MAX_STORE_TIME = /* 1 week */ 7 * 24 * 60 * 60 * 1000;
  private logger = baseLogger.child({ module: "stats" });

  /**
   * The current stats for the server.
   */
  private currentStats: BasicServerStats = {
    collectedAt: new Date(0),

    cpu: {
      usage: 0,
      cores: 0,
    },

    storage: {
      used: 0,
      total: 0,
    },

    memory: {
      used: 0,
      total: 0,
    },

    network: {
      tx: 0,
      rx: 0,
    },
  };

  /**
   * The event emitter for the stat manager.
   */
  public readonly events = new EventEmitter() as TypedEmitter<StatEvents>;

  /**
   * When live stats are needed, this is the interval that is used.
   */
  private liveInterval: NodeJS.Timeout | null = null;

  constructor() {
    void this.update()
      .then(() => this.updateDatabase())
      .catch((err: unknown) => {
        this.logger.error("Failed to update stats", { err });
      });

    // whenever a new listener is added, start the live interval
    this.events.on("newListener", (event) => {
      if (event === "onUpdate") {
        this.liveInterval ??= setInterval(() => {
          void this.update();
        }, 3 * 1000);
      }
    });

    // unregister the event when the listener is removed
    this.events.on("removeListener", (event) => {
      if (event === "onUpdate" && this.events.listenerCount("onUpdate") === 0) {
        if (this.liveInterval === null) return;

        clearInterval(this.liveInterval);
        this.liveInterval = null;
      }
    });
  }

  async start() {
    this.logger.info("Starting hourly stat collection.");
    // collect stats every hour
    setInterval(
      () => {
        void this.update().then(() => this.updateDatabase());
      },
      60 * 60 * 1000,
    );

    // fill data with some initial datapoints if empty
    const [data] = await db
      .select({ value: count() })
      .from(systemStats)
      .where(lte(systemStats.timestamp, Date.now() - 60 * 60 * 1000))
      .execute();

    if (data?.value ?? 1 > 2) {
      return;
    }

    this.logger.info("Initial stat collection needed, filling database.");
    for (let i = 0; i < 3; i++) {
      await this.update();
      await this.updateDatabase();

      // wait 5 seconds between each update
      await new Promise((r) => setTimeout(r, 5 * 1000));
    }

    this.logger.info("Finished initial stat collection.");
  }

  /**
   * Gets the current stats for the server.
   */
  async getCurrentStats() {
    // return the current stats if they were collected within the last 5 minutes
    if (Date.now() - this.currentStats.collectedAt.getTime() < 5 * 60 * 1000) {
      return this.currentStats;
    }

    // otherwise, update the stats and return them
    return this.update();
  }

  /**
   * Updates the stats for the current server and pushes them to the database.
   */
  async update() {
    const [cpuUsage, storage, memory, network] = await Promise.all([
      osu.cpu.usage(),
      osu.drive.info("/"),
      osu.mem.info(),
      osu.netstat.inOut(),
    ]);

    if (typeof network === "string") {
      this.logger.warn(
        "Failed to get network stats, got string instead of object: ",
        network,
      );
    }

    this.currentStats = {
      collectedAt: new Date(),

      cpu: {
        usage: cpuUsage / 100,
        cores: os.cpus().length,
      },

      storage: {
        used: parseInt(storage.usedGb),
        total: parseInt(storage.totalGb),
      },

      memory: {
        used: memory.usedMemMb / 1024,
        total: memory.totalMemMb / 1024,
      },

      network: {
        tx: typeof network === "string" ? -1 : network.total.outputMb,
        rx: typeof network === "string" ? -1 : network.total.inputMb,
      },
    };

    this.events.emit("onUpdate", this.currentStats);
    return this.currentStats;
  }

  /**
   * Updates the database with the current stats.
   */
  async updateDatabase() {
    const startTime = Date.now();
    await db
      .insert(systemStats)
      .values({
        timestamp: this.currentStats.collectedAt.getTime(),
        cpuUsage: this.currentStats.cpu.usage,
        diskUsage: this.currentStats.storage.used * 1024,
        memoryUsage: this.currentStats.memory.used * 1024,
        networkTx: this.currentStats.network.tx / 1024 / 1024,
        networkRx: this.currentStats.network.rx / 1024 / 1024,
      })
      .execute();

    this.logger.debug(
      `Updated database with new stats. Took ${Date.now() - startTime}ms.`,
    );

    // delete old stats
    const count = await db
      .delete(systemStats)
      .where(
        lte(systemStats.timestamp, Date.now() - StatManager.DB_MAX_STORE_TIME),
      )
      .execute();

    this.logger.debug(`Deleted ${count.changes} old stats from the database.`);
  }

  /**
   * Fetches stats from the database in the given time range.
   */
  async getStatsInRange(start: Date, end = Date.now()) {
    return db
      .select()
      .from(systemStats)
      .where(between(systemStats.timestamp, start.getTime(), end));
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
export const stats = (((globalThis as any).statsManager as
  | StatManager
  | undefined) ??= new StatManager());
