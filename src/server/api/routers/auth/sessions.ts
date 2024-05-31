import { sessions } from "~/server/db/schema";
import { authenticatedProcedure, createTRPCRouter } from "../../trpc";
import { eq } from "drizzle-orm";

export const sessionsRouter = createTRPCRouter({
  list: authenticatedProcedure.query(async ({ ctx }) => {
    const activeSessions = await ctx.db
      .select({
        lastUA: sessions.lastUA,
        lastIP: sessions.lastIP,
        lastAccessed: sessions.lastAccessed,
        createdAt: sessions.createdAt,
        token: sessions.token,
      })
      .from(sessions)
      .where(eq(sessions.userId, ctx.session.data.userId));

    return activeSessions.map((session) => ({
      ...session,
      active: session.token === ctx.session.data.token,
      token: undefined,
    }));
  }),
});
