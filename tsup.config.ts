import { defineConfig, type Options } from "tsup";

const opts: Options = {
  platform: "node",
  format: ["esm"],
  treeshake: true,
  clean: true,
  sourcemap: true,
  tsconfig: "tsconfig.server.json",
};

export default defineConfig([
  {
    entryPoints: ["src/server/server.ts"],
    ...opts,
  },
]);
