import Elysia from "elysia";
import { BaseElysiaContext } from "..";

export function createController<T extends string = "">(prefix?: T) {
  return new Elysia<T, BaseElysiaContext>({ prefix });
}
