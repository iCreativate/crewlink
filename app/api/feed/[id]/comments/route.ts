import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/server";
import { createFeedPostComment, listFeedPostComments } from "@/api/feed";

const postSchema = z.object({
  body: z.string().trim().min(1).max(1200),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const items = await listFeedPostComments({ postId: id, take: 20 });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[GET /api/feed/:id/comments]", e);
    return NextResponse.json({ error: "Failed to load comments." }, { status: 503 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const created = await createFeedPostComment({ postId: id, authorId: ctx.appUser.id, body: parsed.data.body });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[POST /api/feed/:id/comments]", e);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 503 });
  }
}

