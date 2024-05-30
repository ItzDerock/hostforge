/* File related utility functions */

import { existsSync } from "fs";

// a more efficient way exists to do this using fs.watch, but these are very short-lived
// and the added latency is not a big deal
export async function waitForFileToExist(
  filepath: string,
  abort?: AbortSignal,
) {
  while (!abort?.aborted && !existsSync(filepath)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return !abort?.aborted;
}
