import { PriorityQueue } from "datastructures-js";
import type { Readable, Writable } from "node:stream";

export function docker404ToNull(err: unknown) {
  if (
    typeof err === "object" &&
    err &&
    "statusCode" in err &&
    err.statusCode === 404
  )
    return null;

  throw err;
}

const MAX_QUEUE_SIZE = 100;
const MAX_HOLD_TIME = 100;

/**
 * Sometimes, docker logs are out of order (maybe investigate this)
 * This function sorts the logs by holding the last `n` logs in memory
 * and writing them in order.
 */
export function streamSort(
  source: Readable,
  dest: Writable,
  compare: (a: Buffer, b: Buffer) => number,
) {
  // keep an internal priority queue of the next line to write
  const pq = new PriorityQueue<Buffer>(compare);

  source.on("data", (buff: Buffer) => {
    pq.enqueue(buff);

    if (pq.size() > MAX_QUEUE_SIZE) {
      dest.write(pq.dequeue());
    } else {
      setTimeout(() => {
        if (pq.isEmpty()) return;
        dest.write(pq.dequeue());
      }, MAX_HOLD_TIME);
    }
  });

  source.on("end", () => {
    while (!pq.isEmpty()) {
      dest.write(pq.dequeue());
    }

    dest.end();
  });
}

/**
 * Parses ISO to nanosecond precision
 */
export function parseISODate(date: string) {
  const nanoseconds = date.split(".")[1]?.split("Z")[0];
  if (!nanoseconds) return new Date(date);

  const ns = BigInt(parseInt(nanoseconds));
  const d = BigInt(new Date(date.split(".")[0] + "Z").getTime());

  return d * BigInt(1e6) + ns;
}

/**
 * Checks if a certain debug flag is enabled
 */
export function isDebugFlagEnabled(flag: string) {
  const enabledFlags = process.env.DEBUG?.split(",") ?? [];

  return enabledFlags.some(
    (userFlag) =>
      userFlag.trim().toLowerCase() === flag.toLowerCase() ||
      userFlag.trim() === "*",
  );
}
