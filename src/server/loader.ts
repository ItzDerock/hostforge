import { Elysia } from "elysia";

export type ElysiaController<T extends Elysia> = (app: Elysia) => T;

type MaybeImported<T> = { default: T } | T;
type Awaitable<T> = T | Promise<T>;

/**
 * Helper to load routes/controllers quickly while maintaining type safety.
 */
export class ElysiaLoader<T extends Elysia> {
  public readonly elysia: T;

  /**
   * Creates a new ElysiaLoader instance.
   * @param elysia The Elysia instance to load routes/controllers into.
   */
  constructor(elysia: T) {
    this.elysia = elysia;
  }

  /**
   * Loads a controller into the Elysia instance.
   * @param controller The controller to load.
   */
  public load<T extends Elysia>(
    controller: Awaitable<MaybeImported<T>>
  ): ElysiaLoader<T> {
    if (controller instanceof Promise) {
      // if the controller is a promise, await it and load it
      return this.load(controller.then((c) => c));
    }

    // retrieve the controller function
    const controllerFn =
      "default" in controller ? controller.default : controller;

    // call the controller function with the Elysia instance
    controllerFn(this.elysia);

    // return this for chaining
    return this as unknown as ElysiaLoader<T>;
  }
}
