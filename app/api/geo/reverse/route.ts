import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

type ReverseCache = {
  fetchedAtMs: number;
  key: string;
  payload: {
    label: string;
    city: string | null;
    region: string | null;
    country: string | null;
    countryCode: string | null;
  };
};

function cacheKey(lat: number, lng: number) {
  // Round to reduce unique keys + protect privacy.
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;
  return `${rLat.toFixed(2)},${rLng.toFixed(2)}`;
}

async function reverseNominatim(lat: number, lng: number) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}` +
    `&lon=${encodeURIComponent(String(lng))}`;

  const res = await fetch(url, {
    // Nominatim policy: identify your application.
    headers: {
      "User-Agent": "CrewLink/0.1 (reverse geocoding)",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`reverse geocode failed: ${res.status}`);
  const json = (await res.json()) as {
    display_name?: string;
    address?: Record<string, unknown>;
  };

  const addr = json.address ?? {};
  const city =
    (typeof addr.city === "string" && addr.city) ||
    (typeof addr.town === "string" && addr.town) ||
    (typeof addr.village === "string" && addr.village) ||
    (typeof addr.suburb === "string" && addr.suburb) ||
    (typeof addr.county === "string" && addr.county) ||
    null;
  const region =
    (typeof addr.state === "string" && addr.state) ||
    (typeof addr.province === "string" && addr.province) ||
    null;
  const country = (typeof addr.country === "string" && addr.country) || null;
  const countryCode = (typeof addr.country_code === "string" && addr.country_code) || null;

  const label =
    [city, region, countryCode ? countryCode.toUpperCase() : null].filter(Boolean).join(", ") ||
    (typeof json.display_name === "string" ? json.display_name : "Near me");

  return { label, city, region, country, countryCode: countryCode ? countryCode.toUpperCase() : null };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ lat: searchParams.get("lat"), lng: searchParams.get("lng") });
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { lat, lng } = parsed.data;
  const key = cacheKey(lat, lng);
  const ttlMs = 1000 * 60 * 60 * 24; // 24 hours
  const now = Date.now();

  const g = globalThis as unknown as Record<string, ReverseCache | undefined>;
  const cacheId = `__crewlink_reverse_${key}`;
  const cached = g[cacheId];
  if (cached && now - cached.fetchedAtMs < ttlMs) {
    return NextResponse.json({ ...cached.payload, cached: true });
  }

  try {
    const payload = await reverseNominatim(lat, lng);
    g[cacheId] = { fetchedAtMs: now, key, payload };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[GET /api/geo/reverse]", e);
    return NextResponse.json({ error: "reverse_unavailable" }, { status: 503 });
  }
}

