import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/persistence/leaderboard/supabaseServerClient";
import type { GameModeId } from "@/lib/modes/types";
import type { RankId } from "@/lib/scoring";
import type { LeaderboardEntry } from "@/lib/persistence/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_MODES = ["streak-5", "streak-10", "streak-15"] as const;
const VALID_RANKS = ["the-flash", "late-for-work", "soccer-mom", "slowpoke"] as const;

type ModeId = (typeof VALID_MODES)[number];
type Rank = (typeof VALID_RANKS)[number];

function isModeId(value: unknown): value is ModeId {
  return typeof value === "string" && (VALID_MODES as readonly string[]).includes(value);
}

function isRankId(value: unknown): value is Rank {
  return typeof value === "string" && (VALID_RANKS as readonly string[]).includes(value);
}

function cleanPlayerName(value: unknown): string {
  const sliced = Array.from(String(value ?? "Player").trim())
    .slice(0, 20)
    .join("")
    .trim();
  return sliced || "Player";
}

interface LeaderboardRow {
  id: string;
  player_name: string;
  mode_id: string;
  scope: string | null;
  total_time_ms: number;
  rank: string;
  created_at: string;
}

function toEntry(row: LeaderboardRow): LeaderboardEntry {
  return {
    id: row.id,
    playerName: row.player_name,
    modeId: row.mode_id as GameModeId,
    scope: row.scope ?? undefined,
    totalTimeMs: row.total_time_ms,
    rankId: isRankId(row.rank) ? (row.rank as RankId) : null,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function emptyBoard() {
  return NextResponse.json({ entries: [] });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return emptyBoard();

    const modeId = req.nextUrl.searchParams.get("modeId");
    const scope = req.nextUrl.searchParams.get("scope");
    if (!isModeId(modeId)) {
      return NextResponse.json({ error: "invalid modeId" }, { status: 400 });
    }

    // Filter before order/limit so PostgREST never ranks the unscoped table first.
    let query = supabase
      .from("leaderboard_runs")
      .select("id, player_name, mode_id, scope, total_time_ms, rank, created_at")
      .eq("mode_id", modeId);

    query = scope ? query.eq("scope", scope) : query.is("scope", null);

    const { data, error } = await query
      .order("total_time_ms", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(7);

    if (error) {
      console.error("[leaderboard] GET failed", error.message);
      return emptyBoard();
    }
    return NextResponse.json({ entries: (data as LeaderboardRow[] | null)?.map(toEntry) ?? [] });
  } catch (error) {
    console.error("[leaderboard] GET threw", error);
    return emptyBoard();
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ ok: false, reason: "leaderboard not configured" });

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const modeId = body.modeId;
    const rankId = body.rankId ?? body.rank;
    const totalTimeMs = body.totalTimeMs;
    const scope = body.scope;

    if (!isModeId(modeId)) return NextResponse.json({ error: "invalid modeId" }, { status: 400 });
    if (!isRankId(rankId)) return NextResponse.json({ error: "invalid rank" }, { status: 400 });
    if (typeof totalTimeMs !== "number" || !Number.isFinite(totalTimeMs) || totalTimeMs <= 0 || totalTimeMs > 1000 * 60 * 60) {
      return NextResponse.json({ error: "invalid totalTimeMs" }, { status: 400 });
    }

    const cleanName = cleanPlayerName(body.playerName);
    const cleanScope = typeof scope === "string" && scope.trim().length > 0 ? scope.trim() : null;

    const { error } = await supabase.from("leaderboard_runs").insert({
      player_name: cleanName,
      mode_id: modeId,
      scope: cleanScope,
      total_time_ms: Math.round(totalTimeMs),
      rank: rankId,
    });

    if (error) {
      console.error("[leaderboard] POST failed", error.message);
      return NextResponse.json({ ok: false, reason: "leaderboard unavailable" });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[leaderboard] POST threw", error);
    return NextResponse.json({ ok: false, reason: "leaderboard unavailable" });
  }
}
