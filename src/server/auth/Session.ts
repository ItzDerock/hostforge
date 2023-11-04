import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { randomBytes } from "crypto";
import assert from "assert";
import { NextRequest } from "next/server";

export type SessionUpdateData = Partial<{
  ua: string;
  ip: string;
}>;

export class Session {
  /**
   * Fetch a session from a session token.
   * @param token The session cookie
   * @returns
   */
  static async fetchFromToken(token: string) {
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
    context: SessionUpdateData | NextRequest,
  ) {
    // parse context
    const parsedContext =
      context instanceof NextRequest
        ? Session.getContextFromRequest(context)
        : context;

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
    context: SessionUpdateData | NextRequest,
  ) {
    // generate a session token
    const token = randomBytes(64).toString("hex");

    // parse context
    const parsedContext =
      context instanceof NextRequest
        ? Session.getContextFromRequest(context)
        : context;

    // insert the session into the database
    const [sessionData] = await db
      .insert(sessions)
      .values({
        lastUA: parsedContext.ua,
        lastIP: parsedContext.ip,
        token,
        userId,
      })
      .returning();

    assert(sessionData, "Session should be created");
    return new Session(sessionData);
  }

  /**
   * Utility function to extract context from a request.
   */
  static getContextFromRequest(request: NextRequest) {
    return {
      ua: request.headers.get("user-agent") ?? undefined,
      ip: request.ip,
    } satisfies SessionUpdateData;
  }

  /**
   * Create a new session instance from a user's session data.
   * @param sessionData The user's session data.
   */
  constructor(public readonly data: typeof sessions.$inferSelect) {}

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
}
