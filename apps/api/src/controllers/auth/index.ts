import { Elysia } from "elysia";
import type { BaseElysiaContext } from "../..";

export const authController = new Elysia<"/auth", BaseElysiaContext>({
  prefix: "/auth",
}).get("/cookie", (...args) => {
  console.log(args);
  return "cookie";
});
