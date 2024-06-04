import { PriorityQueue } from "datastructures-js";
import { Akaya_Kanadaka } from "next/font/google";
import type { Readable, Writable } from "node:stream";
import { EnumLike, z } from "zod";

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

/**
 * Reverses an enum lookup
 */
export function reverseEnumLookupFactory<T extends EnumLike, R extends string>(
  enumToString: Record<keyof T, R>,
): (val: R) => keyof T {
  const reversed = Object.fromEntries(
    Object.entries(enumToString).map(([key, val]) => [val, key]),
  ) as Record<R, keyof T>;

  return (val: R) => {
    if (!Object.keys(reversed).includes(val))
      throw new Error(`Invalid enum value ${val}`);

    return reversed[val];
  };
}

export function zReverseEnumLookup<T extends EnumLike, R extends string>(
  enumToString: Record<keyof T, R>,
) {
  const reversed = reverseEnumLookupFactory(enumToString);
  return zodEnumFromObjKeys(enumToString).transform(
    reversed as (arg: string) => keyof T,
  );
}

function zodEnumFromObjKeys<K extends string>(
  obj: Record<K, unknown>,
): z.ZodEnum<[K, ...K[]]> {
  const [firstKey, ...otherKeys] = Object.keys(obj) as K[];
  return z.enum([firstKey!, ...otherKeys]);
}
