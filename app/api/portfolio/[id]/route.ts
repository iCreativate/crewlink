import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { deletePortfolioItem } from "@/api/portfolio";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authCtx = await getAuthContext();
  if (!authCtx?.appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const ok = await deletePortfolioItem(id, authCtx.appUser.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
