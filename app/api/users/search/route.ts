import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  q: z.string().trim().min(1).max(40),
});

export async function GET(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) return NextResponse.json({ items: [] });

  const q = parsed.data.q;
  const items = await prisma.user.findMany({
    where: {
      OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
    },
    take: 8,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, image: true, role: true, profile: { select: { headline: true } } },
  });

  return NextResponse.json({ items });
}

