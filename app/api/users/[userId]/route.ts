import { NextResponse } from "next/server";
import { getPublicProfile } from "@/api/profile";

export async function GET(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const user = await getPublicProfile(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
