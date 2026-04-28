import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  type: z.enum(["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"]),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await prisma.feedPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.feedPostReaction.upsert({
    where: { postId_userId: { postId, userId: auth.appUser.id } },
    create: { postId, userId: auth.appUser.id, type: parsed.data.type },
    update: { type: parsed.data.type },
  });

  const counts = await prisma.feedPostReaction.groupBy({
    by: ["type"],
    where: { postId },
    _count: { _all: true },
  });

  return NextResponse.json({
    viewerReaction: parsed.data.type,
    reactionCounts: Object.fromEntries(counts.map((c) => [c.type, c._count._all])),
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await ctx.params;
  await prisma.feedPostReaction.deleteMany({ where: { postId, userId: auth.appUser.id } });

  const counts = await prisma.feedPostReaction.groupBy({
    by: ["type"],
    where: { postId },
    _count: { _all: true },
  });

  return NextResponse.json({
    viewerReaction: null,
    reactionCounts: Object.fromEntries(counts.map((c) => [c.type, c._count._all])),
  });
}

