import { execSync } from "node:child_process";

// Creates the schema on a dedicated test database once before the suite runs.
export default function setup() {
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
