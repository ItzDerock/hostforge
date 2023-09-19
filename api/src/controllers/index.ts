import Elysia from "elysia";
import type { BaseElysiaContext } from "../base";

export function createController<T extends string = "">(prefix?: T) {
  return new Elysia<T, BaseElysiaContext>({ prefix });
}
