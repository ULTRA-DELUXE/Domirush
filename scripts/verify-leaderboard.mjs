#!/usr/bin/env node
/**
 * Live QA for polish §6 leaderboard cap.
 * Inserts 10 runs under an isolated scope, asserts 7 fastest remain, then deletes them.
 *
 * Usage: node --env-file=.env.local scripts/verify-leaderboard.mjs
 */
import { createClient } from "@supabase/supabase-js";

const QA_SCOPE = `qa-cap-${Date.now()}`;
const MODE = "streak-5";

const url = process.env.SUPABASE_URL?.trim();
const secret = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

if (!url || !secret) {
  console.error("Need SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const times = [90_000, 80_000, 70_000, 60_000, 50_000, 40_000, 30_000, 20_000, 10_000, 5_000];
  for (const [index, total_time_ms] of times.entries()) {
    const { error } = await supabase.from("leaderboard_runs").insert({
      player_name: `QA ${index + 1}`,
      mode_id: MODE,
      scope: QA_SCOPE,
      total_time_ms,
      rank: "slowpoke",
    });
    if (error) throw new Error(`insert ${index + 1} failed: ${error.message}`);
  }

  const { data, error } = await supabase
    .from("leaderboard_runs")
    .select("player_name, total_time_ms")
    .eq("mode_id", MODE)
    .eq("scope", QA_SCOPE)
    .order("total_time_ms", { ascending: true });

  if (error) throw new Error(`select failed: ${error.message}`);
  const rows = data ?? [];
  assert(rows.length === 7, `expected 7 rows, got ${rows.length}`);
  assert(
    rows.every((row, index) => row.total_time_ms === times.slice().sort((a, b) => a - b)[index]),
    `expected fastest 7 times, got ${rows.map((row) => row.total_time_ms).join(",")}`,
  );

  console.log(`cap ok: scope=${QA_SCOPE} kept ${rows.map((row) => row.total_time_ms).join(",")}`);
} finally {
  const { error } = await supabase.from("leaderboard_runs").delete().eq("scope", QA_SCOPE);
  if (error) {
    console.error(`cleanup failed for scope ${QA_SCOPE}: ${error.message}`);
    process.exit(1);
  }
  const { count, error: countError } = await supabase
    .from("leaderboard_runs")
    .select("id", { count: "exact", head: true })
    .eq("scope", QA_SCOPE);
  if (countError) throw new Error(`cleanup count failed: ${countError.message}`);
  assert((count ?? 0) === 0, `cleanup left ${count} rows for ${QA_SCOPE}`);
  console.log("cleanup ok");
}
