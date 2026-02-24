import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@intrinsic/shared",
        replacement: resolve(__dirname, "../../packages/shared/src/index.ts")
      },
      {
        find: /^@intrinsic\/shared\/(.*)$/,
        replacement: resolve(__dirname, "../../packages/shared/src/$1")
      }
    ]
  },
  test: {
    environment: "node",
    include: ["test/**/*.spec.ts"],
    passWithNoTests: false
  }
});
