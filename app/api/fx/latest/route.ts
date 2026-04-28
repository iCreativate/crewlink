import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  base: z.string().trim().min(3).max(6).optional(),
});

type FxCache = {
  fetchedAtMs: number;
  base: string;
  rates: Record<string, number>;
};

function getCacheKey(base: string) {
  return `__crewlink_fx_cache_${base.toUpperCase()}` as const;
}

async function fetchRates(base: string) {
  // Free endpoint, no key required.
  const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, {
    // Cache on the server between requests.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
  const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
  if (json.result !== "success" || !json.rates) throw new Error("FX response invalid");
  return json.rates;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ base: searchParams.get("base") ?? undefined });
  const base = (parsed.success ? parsed.data.base : undefined) ?? "ZAR";

  const key = getCacheKey(base);
  const ttlMs = 1000 * 60 * 60 * 6; // 6 hours
  const now = Date.now();

  const g = globalThis as unknown as Record<string, FxCache | undefined>;
  const cached = g[key];
  if (cached && cached.base === base.toUpperCase() && now - cached.fetchedAtMs < ttlMs) {
    return NextResponse.json({ base: cached.base, fetchedAtMs: cached.fetchedAtMs, rates: cached.rates });
  }

  try {
    const rates = await fetchRates(base);
    const next: FxCache = { base: base.toUpperCase(), fetchedAtMs: now, rates };
    g[key] = next;
    return NextResponse.json({ base: next.base, fetchedAtMs: next.fetchedAtMs, rates: next.rates });
  } catch (e) {
    // If we have stale cache, return it rather than failing hard.
    if (cached?.rates) {
      return NextResponse.json({
        base: cached.base,
        fetchedAtMs: cached.fetchedAtMs,
        rates: cached.rates,
        stale: true,
      });
    }
    console.error("[GET /api/fx/latest]", e);
    return NextResponse.json({ error: "fx_unavailable" }, { status: 503 });
  }
}

