import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.notification.findMany({
    where: { userId: ctx.appUser.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
  });

  return NextResponse.json({ items });
}

