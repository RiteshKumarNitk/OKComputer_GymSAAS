import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server/__tests__/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
})
