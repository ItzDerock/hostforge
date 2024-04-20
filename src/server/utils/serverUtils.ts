export function docker404ToNull(err: unknown) {
  if (
    typeof err === "object" &&
    err &&
    "statusCode" in err &&
    err.statusCode === 404
  )
    return null;

  throw err;
}
