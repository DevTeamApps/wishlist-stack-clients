import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/server.ts", "src/middleware.ts", "src/react.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  splitting: false,
  treeshake: true,
  tsconfig: "tsconfig.json",
  outExtension({ format }) {
    return { js: format === "esm" ? ".js" : ".cjs" };
  },
});

