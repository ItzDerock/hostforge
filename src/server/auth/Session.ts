import assert from "assert";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema/schema";
import logger from "../utils/logger";

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
