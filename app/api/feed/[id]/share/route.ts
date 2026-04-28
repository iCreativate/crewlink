import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { shareFeedPost } from "@/api/feed";
import { z } from "zod";

const shareSchema = z.object({
  body: z.string().trim().max(5000).optional().nullable(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = shareSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const created = await shareFeedPost({ authorId: auth.appUser.id, postId: id, body: parsed.data.body ?? null });
  if (!created) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

