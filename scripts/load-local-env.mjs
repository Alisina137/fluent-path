import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

// Match the app's local-development convention: .env.local overrides .env,
// while already-exported process variables remain authoritative (CI/production).
export function loadLocalEnvironment() {
  for (const name of [".env.local", ".env"]) {
    const file = path.resolve(process.cwd(), name);
    if (!fs.existsSync(file)) continue;
    const values = parse(fs.readFileSync(file));
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export function requireDatabaseUrl() {
  loadLocalEnvironment();
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is missing. Add it to .env.local or export it in the current environment.");
  return value;
}
