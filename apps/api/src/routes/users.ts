import type { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export default (router: Hono) =>
  router
    .get("/users", (c) => c.text("Hello Hono!"))
    .post(
      // path
      "/users/create",

      // body validator
      zValidator(
        "json",
        z.object({
          username: z.string(),
          password: z.string(),
        })
      ),

      // handler
      (c) => c.jsonT({ status: "ok" })
    );
