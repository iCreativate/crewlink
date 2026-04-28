import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  minutes: z.number().int().min(5).max(60 * 24 * 30), // up to 30 days
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await prisma.feedPost.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (post.authorId !== auth.appUser.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const boostedUntil = new Date(Date.now() + parsed.data.minutes * 60_000);
  const updated = await prisma.feedPost.update({
    where: { id },
    data: { boostedUntil },
    select: { id: true, boostedUntil: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const post = await prisma.feedPost.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (post.authorId !== auth.appUser.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const updated = await prisma.feedPost.update({
    where: { id },
    data: { boostedUntil: null },
    select: { id: true, boostedUntil: true },
  });

  return NextResponse.json(updated);
}

