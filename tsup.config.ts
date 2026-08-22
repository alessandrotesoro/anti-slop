import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    effect: "src/effect/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: "es2024",
  external: ["@oxlint/plugins"],
});
