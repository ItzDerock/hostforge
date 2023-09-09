import { Env, Hono, Schema } from "hono";

type Imported<T> = T | Promise<{ default: T }>;

/**
 * A very simple route manager for Hono to keep the types correct for RPC.
 */
export class HonoRouter<
  E extends Env = {},
  S extends Schema = {},
  B extends string = "/",
> {
  public readonly hono: Hono<E, S, B>;

  constructor(hono: Hono<E, S, B>) {
    this.hono = hono;
  }

  /**
   * Register route(s).
   *
   * @example router.register(import("./routes/root"));
   *
   * @param cb The function that is ran to register the route.
   * @returns This.
   */
  public register<En extends Env, Sn extends Schema>(
    cb: Imported<(hono: Hono) => Hono<En, Sn, B>>
  ) {
    if (cb instanceof Promise) {
      cb.then((cb) => cb.default(this.hono as unknown as Hono));
    } else {
      cb(this.hono as unknown as Hono);
    }

    return this as unknown as HonoRouter<E, S & Sn, B>;
  }
}
