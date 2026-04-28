import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { likeFeedPost, unlikeFeedPost } from "@/api/feed";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const counts = await likeFeedPost(id, auth.appUser.id);
  await prisma.feedPostReaction.upsert({
    where: { postId_userId: { postId: id, userId: auth.appUser.id } },
    create: { postId: id, userId: auth.appUser.id, type: "LIKE" },
    update: { type: "LIKE" },
  });
  return NextResponse.json({ ok: true, ...counts, likedByViewer: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const counts = await unlikeFeedPost(id, auth.appUser.id);
  await prisma.feedPostReaction.deleteMany({ where: { postId: id, userId: auth.appUser.id } });
  return NextResponse.json({ ok: true, ...counts, likedByViewer: false });
}

