import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests share one SQLite test database, so run them serially.
    fileParallelism: false,
    globalSetup: ["./test/globalSetup.ts"],
    env: {
      DATABASE_URL: "file:./test.db",
      JWT_SECRET: "test-secret",
      NODE_ENV: "test",
    },
    include: ["test/**/*.test.ts"],
  },
});
