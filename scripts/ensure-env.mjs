// Ensures server/.env exists (it is gitignored, so a fresh clone won't have it).
// Cross-platform: runs via Node so it works on Windows, macOS, and Linux.
import { existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serverDir = join(here, "..", "server");
const envPath = join(serverDir, ".env");
const examplePath = join(serverDir, ".env.example");

if (existsSync(envPath)) {
  console.log("server/.env already exists — leaving it as-is.");
} else if (existsSync(examplePath)) {
  copyFileSync(examplePath, envPath);
  console.log("Created server/.env from server/.env.example");
} else {
  console.warn("WARNING: server/.env.example not found; could not create .env");
  process.exit(1);
}
