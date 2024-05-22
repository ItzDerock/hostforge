import { type ChildProcess } from "child_process";
import path from "path";

/**
 * Joins the path but makes sure you don't go above the root path
 * @param rootPath
 * @param paths
 * @returns
 */
export function joinPathLimited(rootPath: string, ...paths: string[]): string {
  const joinedPath = path.join(rootPath, ...paths);
  if (!joinedPath.startsWith(rootPath)) {
    throw new Error("Path is outside of the root path");
  }
  return joinedPath;
}

export function waitForExit(child: ChildProcess) {
  return new Promise<void>((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Child process exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}
