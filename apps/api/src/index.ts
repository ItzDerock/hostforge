import { Hono } from "hono";
import { HonoRouter } from "./router";
import { logger } from "hono/logger";

const app = new Hono();

// logger
app.use("*", logger());

const router = new HonoRouter(app)
  .register(import("./routes/root"))
  .register(import("./routes/users"));

export type AppType = typeof router.hono;
export default router.hono;
