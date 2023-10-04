import type { BaseElysia } from "../../base";
type Context = Parameters<Parameters<BaseElysia["post"]>[1]>[0];

export function isSignedIn(ctx: Context) {
  if (!ctx.user) {
    ctx.set.status = 401;
    return { error: "Unauthorized" };
  }
}
