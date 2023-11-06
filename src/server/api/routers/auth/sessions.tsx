import { sessions } from "~/server/db/schema";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import { eq } from "drizzle-orm";
import { Session } from "~/server/auth/Session";

export const sessionsRouter = createTRPCRouter({
  list: authenticatedProcedure.query(async ({ ctx }) => {
    const activeSessions = ctx.db
      .select({
        lastUA: sessions.lastUA,
        lastIP: sessions.lastIP,
        lastAccessed: sessions.lastAccessed,
        createdAt: sessions.createdAt,
        id: sessions.token,
      })
      .from(sessions)
      .where(eq(sessions.userId, ctx.session.data.userId));

    return activeSessions;
  }),
});
