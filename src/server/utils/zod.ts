import z from "zod";

export const zDockerName = z.string().regex(/^[a-z0-9-]+$/, {
  message: "Must be lowercase alphanumeric with dashes.",
});

export const zDockerImage = z
  .string()
  .regex(
    /^(?:(?=[^:\/]{1,253})(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*(?::[0-9]{1,5})?\/)?((?![._-])(?:[a-z0-9._-]*)(?<![._-])(?:\/(?![._-])[a-z0-9._-]*(?<![._-]))*)(?::(?![.-])[a-zA-Z0-9_.-]{1,128})?$/,
    {
      message: "Must be a valid Docker image name. (Regex failed)",
    },
  );

export const zDockerDuration = z
  .string()
  .regex(/(?:[\d.]+h)?(?:[\d.]+m)?(?:[\d.]+s)?/, {
    message: "Must be a valid duration. (Regex failed)",
  });
