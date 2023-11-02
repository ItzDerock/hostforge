import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";

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
    context: {
      ip?: string;
      ua?: string;
    },
  ) {
    const [sessionData] = await db
      .update(sessions)
      .set({ lastAccessed: new Date(), lastIP: context.ip, lastUA: context.ua })
      .where(eq(sessions.token, token))
      .returning();

    if (!sessionData) {
      return null;
    }

    return new Session(sessionData);
  }

  /**
   * Create a new session instance from a user's session data.
   * @param sessionData The user's session data.
   */
  constructor(public readonly data: typeof sessions.$inferSelect) {}
}
