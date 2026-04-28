import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { savePortfolioItem, unsavePortfolioItem } from "@/api/portfolio";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const counts = await savePortfolioItem(id, auth.appUser.id);
  return NextResponse.json({ ok: true, ...counts, savedByViewer: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const counts = await unsavePortfolioItem(id, auth.appUser.id);
  return NextResponse.json({ ok: true, ...counts, savedByViewer: false });
}

