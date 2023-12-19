import z from "zod";

export const zDockerName = z.string().regex(/^[a-z0-9-]+$/, {
  message: "Must be lowercase alphanumeric with dashes.",
});
