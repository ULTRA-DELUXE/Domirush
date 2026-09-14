import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getSupabaseServerClient = vi.fn();

vi.mock("@/lib/persistence/leaderboard/supabaseServerClient", () => ({
  getSupabaseServerClient: () => getSupabaseServerClient(),
}));

import { GET, POST } from "@/app/api/leaderboard/route";

function getRequest(modeId?: string, scope?: string) {
  const url = new URL("http://localhost/api/leaderboard");
  if (modeId) url.searchParams.set("modeId", modeId);
  if (scope) url.searchParams.set("scope", scope);
  return new NextRequest(url);
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    getSupabaseServerClient.mockReset();
  });

  it("returns an empty board when Supabase is not configured", async () => {
    getSupabaseServerClient.mockReturnValue(null);
    const res = await GET(getRequest("streak-5"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ entries: [] });
  });

  it("rejects an unknown mode", async () => {
    getSupabaseServerClient.mockReturnValue({});
    const res = await GET(getRequest("practice"));
    expect(res.status).toBe(400);
  });

  it("maps rows into leaderboard entries", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            player_name: "Ada",
            mode_id: "streak-5",
            scope: null,
            total_time_ms: 12_000,
            rank: "the-flash",
            created_at: "2026-09-14T00:00:00.000Z",
          },
        ],
        error: null,
      }),
    };
    getSupabaseServerClient.mockReturnValue({ from: () => chain });

    const res = await GET(getRequest("streak-5"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.entries).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        playerName: "Ada",
        modeId: "streak-5",
        scope: undefined,
        totalTimeMs: 12_000,
        rankId: "the-flash",
        createdAt: Date.parse("2026-09-14T00:00:00.000Z"),
      },
    ]);
  });

  it("filters the unscoped board with IS NULL before ordering", async () => {
    const calls: string[] = [];
    const chain = {
      select: vi.fn(() => {
        calls.push("select");
        return chain;
      }),
      eq: vi.fn(() => {
        calls.push("eq");
        return chain;
      }),
      is: vi.fn(() => {
        calls.push("is");
        return chain;
      }),
      order: vi.fn(() => {
        calls.push("order");
        return chain;
      }),
      limit: vi.fn(() => {
        calls.push("limit");
        return Promise.resolve({ data: [], error: null });
      }),
    };
    getSupabaseServerClient.mockReturnValue({ from: () => chain });

    await GET(getRequest("streak-10"));
    expect(calls).toEqual(["select", "eq", "is", "order", "order", "limit"]);
    expect(chain.eq).toHaveBeenCalledWith("mode_id", "streak-10");
    expect(chain.is).toHaveBeenCalledWith("scope", null);
  });

  it("filters a named scope before ordering", async () => {
    const calls: string[] = [];
    const chain = {
      select: vi.fn(() => {
        calls.push("select");
        return chain;
      }),
      eq: vi.fn(() => {
        calls.push("eq");
        return chain;
      }),
      is: vi.fn(() => {
        calls.push("is");
        return chain;
      }),
      order: vi.fn(() => {
        calls.push("order");
        return chain;
      }),
      limit: vi.fn(() => {
        calls.push("limit");
        return Promise.resolve({ data: [], error: null });
      }),
    };
    getSupabaseServerClient.mockReturnValue({ from: () => chain });

    await GET(getRequest("streak-15", "daily-2026-09-14"));
    expect(calls).toEqual(["select", "eq", "eq", "order", "order", "limit"]);
    expect(chain.eq).toHaveBeenNthCalledWith(1, "mode_id", "streak-15");
    expect(chain.eq).toHaveBeenNthCalledWith(2, "scope", "daily-2026-09-14");
    expect(chain.is).not.toHaveBeenCalled();
  });

  it("returns an empty board when supabase errors", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
    };
    getSupabaseServerClient.mockReturnValue({ from: () => chain });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await GET(getRequest("streak-5"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ entries: [] });
    error.mockRestore();
  });
});

describe("POST /api/leaderboard", () => {
  beforeEach(() => {
    getSupabaseServerClient.mockReset();
  });

  it("no-ops when Supabase is not configured", async () => {
    getSupabaseServerClient.mockReturnValue(null);
    const res = await POST(
      postRequest({
        playerName: "Ada",
        modeId: "streak-5",
        totalTimeMs: 12_000,
        rankId: "the-flash",
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "leaderboard not configured" });
  });

  it("rejects invalid payloads", async () => {
    getSupabaseServerClient.mockReturnValue({ from: vi.fn() });
    expect((await POST(postRequest({ modeId: "nope" }))).status).toBe(400);
    expect(
      (
        await POST(
          postRequest({ modeId: "streak-5", rankId: "the-flash", totalTimeMs: 0 }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          postRequest({ modeId: "streak-5", rankId: "nope", totalTimeMs: 1000 }),
        )
      ).status,
    ).toBe(400);
  });

  it("inserts a validated run", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    getSupabaseServerClient.mockReturnValue({ from: () => ({ insert }) });

    const res = await POST(
      postRequest({
        playerName: "  Ada Lovelace is too long  ",
        modeId: "streak-5",
        totalTimeMs: 12_000.9,
        rankId: "the-flash",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({
      player_name: "Ada Lovelace is too",
      mode_id: "streak-5",
      scope: null,
      total_time_ms: 12_001,
      rank: "the-flash",
    });
  });

  it("accepts the polish-doc rank field name", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    getSupabaseServerClient.mockReturnValue({ from: () => ({ insert }) });

    const res = await POST(
      postRequest({
        playerName: "Ada",
        modeId: "streak-5",
        totalTimeMs: 12_000,
        rank: "late-for-work",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ rank: "late-for-work", player_name: "Ada" }),
    );
  });

  it("no-ops on a supabase insert failure so results are never blocked", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "nope" } });
    getSupabaseServerClient.mockReturnValue({ from: () => ({ insert }) });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await POST(
      postRequest({
        playerName: "Ada",
        modeId: "streak-5",
        totalTimeMs: 12_000,
        rankId: "the-flash",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "leaderboard unavailable" });
    error.mockRestore();
  });

  it("rejects non-finite times", async () => {
    getSupabaseServerClient.mockReturnValue({ from: vi.fn() });
    expect(
      (await POST(postRequest({ modeId: "streak-5", rankId: "the-flash", totalTimeMs: Number.NaN }))).status,
    ).toBe(400);
  });
});
