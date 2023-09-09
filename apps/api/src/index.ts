import { Hono } from "hono";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { timing } from "hono/timing";
import { secureHeaders } from "hono/secure-headers";
import { HonoRouter } from "./router";

const app = new Hono();

// load middlewares
app.use("*", logger());
app.use("*", compress());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "*",
    credentials: true,
  })
);

app.use(
  "*",
  timing({
    enabled: process.env.API_TIMINGS === "true",
  })
);

// load routes
const router = new HonoRouter(app)
  .register(import("./routes/root"))
  .register(import("./routes/users"));

export type AppType = typeof router.hono;
export default router.hono;
