import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { randomBytes } from "crypto";
import assert from "assert";
import { env } from "~/env";
import { IncomingMessage } from "http";
import type { ExtendedRequest } from "../api/trpc";
import logger from "../utils/logger";
import crypto from "crypto";

export type SessionUpdateData = Partial<{
  ua: string;
  ip: string;
}>;

export class Session {
  /**
   * The length of time a session should last.
   * currently 30 days.
   */
  static readonly EXPIRE_TIME = 1000 * 60 * 60 * 24 * 30;
  static readonly logger = logger.child({ module: "sessions" });

  /**
   * Hash function
   */
  static hash(token: string) {
    return crypto
      .createHash("sha256")
      .update(token + env.SESSION_SECRET)
      .digest("hex");
  }

  /**
   * Fetch a session from a session token.
   * @param token The session cookie
   * @returns
   */
  static async fetchFromToken(token: string) {
    // hash token
    token = this.hash(token);

    const [sessionData] = await db
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
  static async fetchFromTokenAndUpdate(
    token: string,
    context: SessionUpdateData | ExtendedRequest,
  ) {
    // parse context
    const parsedContext =
      context instanceof IncomingMessage
        ? Session.getContextFromRequest(context)
        : context;

    // hash token
    token = this.hash(token);

    const [sessionData] = await db
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
  static async createForUser(
    userId: string,
    context: SessionUpdateData | ExtendedRequest,
  ) {
    // generate a session token
    const token = randomBytes(64).toString("hex");

    // parse context
    const parsedContext =
      context instanceof IncomingMessage
        ? Session.getContextFromRequest(context)
        : context;

    // insert the session into the database
    const [sessionData] = await db
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

  /**
   * Utility function to extract context from a request.
   */
  static getContextFromRequest(request: ExtendedRequest) {
    return {
      ip: request.ip,
      ua: request.headers["user-agent"],
    } satisfies SessionUpdateData;
  }

  /**
   * Create a new session instance from a user's session data.
   * @param sessionData The user's session data.
   * @param unhashedSessionToken The unhashed session token.
   */
  constructor(
    public readonly data: typeof sessions.$inferSelect,
    private readonly unhashedSessionToken?: string,
  ) {}

  /**
   * Get the user associated with this session.
   */
  async getUser() {
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, this.data.userId));

    // if the user doesn't exist, it was deleted.
    // delete the session and throw an error.
    if (!userData) {
      await this.delete();
      throw new Error("User does not exist");
    }

    return userData;
  }

  /**
   * Delete this session.
   */
  async delete() {
    await db.delete(sessions).where(eq(sessions.token, this.data.token));
  }

  /**
   * Returns a cookie string for this session.
   */
  getCookieString() {
    assert(this.unhashedSessionToken, "Sessions cannot be unhashed");

    const expire = new Date(this.data.createdAt + Session.EXPIRE_TIME);
    return `sessionToken=${
      this.unhashedSessionToken
    }; Expires=${expire.toUTCString()}; Path=/; HttpOnly; SameSite=Strict`;
  }
}
