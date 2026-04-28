import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { emitEmergencyJobToNearbyFreelancers, getNearbyFreelancerUserIdsForEmergency } from "@/api/emergency-broadcast";
import { getRankedMatchesForJob } from "@/api/job-matching";
import { createJobForPoster, listOpenJobsForFeedWithLocation } from "@/api/jobs";
import { jobCreateSchema } from "@/lib/validations";
import { emitToJobsRoom } from "@/lib/socket-global";

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext();
    const viewer = ctx?.appUser?.role === "FREELANCER" ? { id: ctx.appUser.id, role: ctx.appUser.role } : null;
    const { searchParams } = new URL(req.url);
    const near = (searchParams.get("near") ?? "").trim();
    const jobs = await listOpenJobsForFeedWithLocation(viewer, near.length ? near : null);
    return NextResponse.json(jobs);
  } catch (e) {
    console.error("[GET /api/jobs]", e);
    return NextResponse.json(
      {
        error: "Failed to load jobs.",
        hint: "If you recently pulled code, run: npx prisma migrate deploy (or prisma db push) against DATABASE_URL.",
      },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Only media houses can post jobs." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = jobCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, budgetMin, budgetMax, location, startsAt, payRate, gearRequirements, emergencyMode } =
    parsed.data;
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    return NextResponse.json({ error: "Budget min cannot exceed max." }, { status: 400 });
  }

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid date/time." }, { status: 400 });
  }

  const job = await createJobForPoster({
    posterId: ctx.appUser.id,
    title,
    description: description ?? "",
    location,
    startsAt: startDate,
    payRate,
    gearRequirements,
    budgetMin,
    budgetMax,
    emergencyMode,
  });

  emitToJobsRoom("job:new", job);

  if (emergencyMode) {
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
  }

  const crewSuggestions = await getRankedMatchesForJob(job.id, 30);
  return NextResponse.json({ ...job, crewSuggestions }, { status: 201 });
}
