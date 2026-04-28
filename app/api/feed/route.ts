import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createFeedPost, listFeed } from "@/api/feed";
import { z } from "zod";

const createSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional().nullable(),
  mediaUrl: z.string().trim().min(1).max(2000).optional().nullable(),
  mediaItems: z
    .array(
      z.object({
        mediaType: z.enum(["IMAGE", "VIDEO"]),
        url: z.string().trim().min(1).max(2000),
      }),
    )
    .max(10)
    .optional(),
  kind: z.enum(["POST", "AD"]).optional(),
  adType: z.enum(["SPONSORED_POST", "OPPORTUNITY", "FEATURED_CREATOR"]).optional().nullable(),
  ctaLabel: z.string().trim().max(40).optional().nullable(),
  ctaHref: z.string().trim().max(2000).optional().nullable(),
  bts: z.boolean().optional().default(false),
  collab: z.boolean().optional().default(false),
  collabNote: z.string().trim().max(240).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  collaborators: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
});

export async function GET(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const takeRaw = searchParams.get("take");
  const cursor = searchParams.get("cursor");
  const tab = (searchParams.get("tab") ?? "for-you").toLowerCase();
  const take = takeRaw ? Number(takeRaw) : 12;

  try {
    const feed = await listFeed({
      take: Number.isFinite(take) ? take : 12,
      cursor: cursor || null,
      viewerId: ctx.appUser.id,
      collabOnly: tab === "collabs",
    });
    return NextResponse.json(feed);
  } catch (e) {
    console.error("[GET /api/feed]", e);
    return NextResponse.json({ error: "Failed to load feed." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if ((parsed.data.mediaType && !parsed.data.mediaUrl) || (!parsed.data.mediaType && parsed.data.mediaUrl)) {
    return NextResponse.json({ error: "mediaType and mediaUrl must be provided together." }, { status: 400 });
  }
  if (parsed.data.mediaItems?.length && (parsed.data.mediaType || parsed.data.mediaUrl)) {
    return NextResponse.json({ error: "Use either mediaItems or mediaType/mediaUrl, not both." }, { status: 400 });
  }

  const created = await createFeedPost({
    authorId: ctx.appUser.id,
    body: parsed.data.body,
    mediaType: parsed.data.mediaType ?? null,
    mediaUrl: parsed.data.mediaUrl ?? null,
    mediaItems: parsed.data.mediaItems ?? null,
    kind: parsed.data.kind ?? "POST",
    adType: parsed.data.adType ?? null,
    ctaLabel: parsed.data.ctaLabel ?? null,
    ctaHref: parsed.data.ctaHref ?? null,
    bts: parsed.data.bts,
    collab: parsed.data.collab,
    collabNote: parsed.data.collabNote ?? null,
    location: parsed.data.location ?? null,
    collaborators: parsed.data.collaborators ?? [],
  });

  return NextResponse.json(
    {
      ...created,
      likedByViewer: false,
      likesCount: created._count.likes,
      sharesCount: created._count.shares,
      _count: undefined,
    },
    { status: 201 },
  );
}

