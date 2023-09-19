import { init } from "@paralleldrive/cuid2";

export const createSessionId = init({
  length: 32,
});
