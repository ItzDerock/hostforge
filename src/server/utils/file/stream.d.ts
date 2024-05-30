import { Readable } from "node:stream";

declare class TailFileStream extends Readable {
  constructor(path: string, options?: TailFileStreamOptions);
  readonly pending: boolean;
  readonly watching: boolean;
  readonly waiting: boolean;
  close(cb?: (err?: NodeJS.ErrnoException) => void): void;
  watch(): void;
  unwatch(): void;
}

interface TailFileStreamOptions {
  highWaterMark?: number;
  flags?: string;
  mode?: number;
  start?: number;
  end?: number;
  autoWatch?: boolean;
  persistent?: boolean;
}

declare function createReadStream(
  path: string,
  options?: TailFileStreamOptions,
): TailFileStream;

export { TailFileStream, TailFileStreamOptions, createReadStream };
