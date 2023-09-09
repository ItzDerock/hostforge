import { Hono } from "hono";

export default (router: Hono) =>
  router.get("/", (c) => c.jsonT({ status: "ok" }));
