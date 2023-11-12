import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import osu from "node-os-utils";
import os from "os";
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
    listener: (...args: any[]) => void,
  ) => void;

  /**
   * Built-in Node.JS event, emitted whenever a listener is removed.
   */
  removeListener: (
    event: string | symbol,
    listener: (...args: any[]) => void,
  ) => void;
};

/**
 * Manages the stats for the current server.
 */
export class StatManager {
  private logger = baseLogger.child({ module: "StatManager" });

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
    this.update();

    // collect stats every hour
    setInterval(
      async () => {
        await this.update();
        await this.updateDatabase();
      },
      60 * 60 * 1000,
    );

    // whenever a new listener is added, start the live interval
    this.events.on("newListener", (event) => {
      if (event === "onUpdate") {
        this.liveInterval ??= setInterval(async () => {
          await this.update();
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
  async updateDatabase() {}
}

export const stats = new StatManager();
