import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { getRankedMatchesForJob } from "@/api/job-matching";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authCtx = await getAuthContext();
  if (!authCtx?.appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (authCtx.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Only media houses can view crew suggestions." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const job = await prisma.job.findFirst({
    where: { id, posterId: authCtx.appUser.id },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const matches = await getRankedMatchesForJob(id, 30);

  return NextResponse.json({
    matches: matches.map((m) => ({
      user: m.user,
      headline: m.profile.headline,
      location: m.profile.location,
      availableNow: m.profile.availableNow,
      specializations: m.profile.specializations,
      gearTags: m.profile.gearTags,
      breakdown: m.breakdown,
    })),
  });
}
