import { NextResponse } from "next/server";
import { activateJobEmergency } from "@/api/jobs";
import { emitEmergencyJobToNearbyFreelancers, getNearbyFreelancerUserIdsForEmergency } from "@/api/emergency-broadcast";
import { getAuthContext } from "@/lib/auth/server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Only media houses can activate emergency mode." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const result = await activateJobEmergency(id, auth.appUser.id);

  if (!result.ok) {
    if (result.code === "invited_only") {
      return NextResponse.json(
        { error: "Emergency broadcasts apply to open listings, not direct offers." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Job not found or not open." }, { status: 404 });
  }

  const job = result.job;
  const targetIds = await getNearbyFreelancerUserIdsForEmergency(job);
  emitEmergencyJobToNearbyFreelancers(
    {
      ...job,
      startsAt: job.startsAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    },
    targetIds,
  );

  return NextResponse.json({ ok: true, job, notifiedCount: targetIds.length });
}
