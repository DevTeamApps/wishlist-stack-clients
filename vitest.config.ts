import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/*/test/**/*.test.{ts,tsx}"],
    setupFiles: [
      "packages/client/test/setup.ts",
      "packages/hydrogen/test/setup.ts"
    ],
    pool: "threads",
  },
});

