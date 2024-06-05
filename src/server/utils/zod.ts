import z from "zod";

export const zDockerName = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/, {
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

export const zDomain = z
  .string()
  .regex(
    /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/,
    { message: "Invalid domain name. (Regex)" },
  );

export const zPort = z
  .string()
  .regex(
    /^((\d{1,5}(-\d{1,5})?(:\d{1,5}(-\d{1,5})?)?)|((\d{1,3}\.){3}\d{1,3}:\d{1,5}(-\d{1,5})?(:\d{1,5}(-\d{1,5})?)?))(\/(tcp|udp))?$/,
    { message: "Invalid port. (Regex failed)" },
  );
