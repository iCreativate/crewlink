import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  minutes: z.number().int().min(30).max(60 * 24 * 30), // up to 30 days
});

export async function POST(req: Request) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const boostedUntil = new Date(Date.now() + parsed.data.minutes * 60_000);
  const updated = await prisma.user.update({
    where: { id: auth.appUser.id },
    data: { boostedUntil },
    select: { id: true, boostedUntil: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE() {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updated = await prisma.user.update({
    where: { id: auth.appUser.id },
    data: { boostedUntil: null },
    select: { id: true, boostedUntil: true },
  });

  return NextResponse.json(updated);
}

