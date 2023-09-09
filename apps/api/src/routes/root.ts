import type { Hono } from "hono";
import { success } from "../utils/response";

export default (router: Hono) => router.get("/", (c) => c.jsonT(success()));
