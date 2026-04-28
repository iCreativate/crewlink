import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  if (userId === ctx.appUser.id) return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 });

  await prisma.userFollow.upsert({
    where: { followerId_followingId: { followerId: ctx.appUser.id, followingId: userId } },
    create: { followerId: ctx.appUser.id, followingId: userId },
    update: {},
  });

  return NextResponse.json({ following: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  await prisma.userFollow.deleteMany({ where: { followerId: ctx.appUser.id, followingId: userId } });

  return NextResponse.json({ following: false });
}

