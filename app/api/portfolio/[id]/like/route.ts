import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { likePortfolioItem, unlikePortfolioItem } from "@/api/portfolio";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const counts = await likePortfolioItem(id, auth.appUser.id);
  return NextResponse.json({ ok: true, ...counts, likedByViewer: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const counts = await unlikePortfolioItem(id, auth.appUser.id);
  return NextResponse.json({ ok: true, ...counts, likedByViewer: false });
}

