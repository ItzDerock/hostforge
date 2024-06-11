export function ignore409(err: unknown) {
  if (err instanceof Error && "statusCode" in err && err.statusCode == 409) {
    // network already exists, ignore
    return false;
  }

  throw err;
}
