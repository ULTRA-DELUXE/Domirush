#!/usr/bin/env node
/**
 * Apply scripts/supabase-leaderboard.sql via the Supabase session pooler.
 * Usage: node --env-file=.env.local scripts/apply-leaderboard-schema.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.SUPABASE_URL?.trim();
const password = process.env.SUPABASE_DB_PASSWORD;

if (!url || !password) {
  console.error("Need SUPABASE_URL and SUPABASE_DB_PASSWORD in the environment.");
  process.exit(1);
}

const ref = new URL(url).hostname.split(".")[0];
const host = process.env.SUPABASE_DB_POOLER_HOST ?? "aws-0-ap-northeast-1.pooler.supabase.com";
const conn = `postgresql://postgres.${ref}@${host}:5432/postgres`;
const sqlPath = path.join(root, process.argv[2] ?? "scripts/supabase-leaderboard.sql");

const result = spawnSync(
  "psql",
  [conn, "-v", "ON_ERROR_STOP=1", "-f", sqlPath],
  {
    env: { ...process.env, PGPASSWORD: password, PGSSLMODE: "require" },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
