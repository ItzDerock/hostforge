import { hc } from "hono/client";
import type { AppType } from ".";

const api = hc<AppType>("http://localhost:3000");

api.users.create.$post({
  json: { username: "string", password: "asdf" },
});
