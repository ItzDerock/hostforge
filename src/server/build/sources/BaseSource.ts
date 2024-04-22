import { type serviceGeneration } from "~/server/db/schema";
import type BuilderLogger from "../utils/BuilderLogger";

export default class BaseSource {
  constructor(
    public readonly configuration: {
      fileLogger: BuilderLogger;
      workDirectory: string;
      serviceConfiguration: typeof serviceGeneration.$inferSelect;
    },
  ) {}

  /**
   * Pulls the code from the source.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async downloadCode(): Promise<void> {
    throw new Error("Not implemented");
  }
}
