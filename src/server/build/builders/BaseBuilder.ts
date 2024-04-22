import { type service } from "../../db/schema";
import type BuilderLogger from "../utils/BuilderLogger";

export default class BaseBuilder {
  constructor(
    public readonly configuration: {
      fileLogger: BuilderLogger;
      workDirectory: string;
      serviceConfiguration: typeof service.$inferSelect;
    },
  ) {}

  /**
   * Builds the service, returning the docker tag.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async build(): Promise<string> {
    throw new Error("Not implemented");
  }
}
