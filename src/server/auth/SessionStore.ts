import type { Database } from "../db";
import crypto, { randomBytes } from "crypto";
import type { GlobalStore } from "../managers/GlobalContext";
import { sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { Session, type SessionUpdateData } from "./Session";
import type { ExtendedRequest } from "../api/trpc";
import { IncomingMessage } from "node:http";
import assert from "assert";

export class SessionStore {
  /**
   * Utility function to extract context from a request.
   */
  static getContextFromRequest(request: ExtendedRequest) {
    return {
      ip: request.ip,
      ua: request.headers["user-agent"],
    } satisfies SessionUpdateData;
  }

  constructor(
    private db: Database,
    private store: GlobalStore,
  ) {}

  /**
   * Hash function
   */
  public hash(token: string) {
    return crypto
      .createHash("sha256")
      .update(token + this.store.settings.getSettings().sessionSecret)
      .digest("hex");
  }

  /**
   * Fetch a session from a session token.
   * @param token The session cookie
   * @returns
   */
  public async fetchFromToken(token: string) {
    // hash token
    token = this.hash(token);

    const [sessionData] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));

    if (!sessionData) {
      return null;
    }

    return new Session(sessionData);
  }

  /**
   * Similar to fetchFromToken, but also updates the session's lastAccessed, lastIP, and lastUA fields.
   * @param token The session cookie
   * @param context The context of the request
   * @returns
   */
  public async fetchFromTokenAndUpdate(
    token: string,
    context: SessionUpdateData | ExtendedRequest,
  ) {
    // parse context
    const parsedContext =
      context instanceof IncomingMessage
        ? SessionStore.getContextFromRequest(context)
        : context;

    // hash token
    token = this.hash(token);

    const [sessionData] = await this.db
      .update(sessions)
      .set({
        lastAccessed: new Date(),
        lastIP: parsedContext.ip,
        lastUA: parsedContext.ua,
      })
      .where(eq(sessions.token, token))
      .returning();

    if (!sessionData) {
      return null;
    }

    return new Session(sessionData);
  }

  /**
   * Create a new session for a user.
   */
  public async createForUser(
    userId: string,
    context: SessionUpdateData | ExtendedRequest,
  ) {
    // generate a session token
    const token = randomBytes(64).toString("hex");

    // parse context
    const parsedContext =
      context instanceof IncomingMessage
        ? SessionStore.getContextFromRequest(context)
        : context;

    // insert the session into the database
    const [sessionData] = await this.db
      .insert(sessions)
      .values({
        lastUA: parsedContext.ua,
        lastIP: parsedContext.ip,
        token: this.hash(token),
        userId,
      })
      .returning();

    assert(sessionData, "Session should be created");
    return new Session(sessionData, token);
  }
}
