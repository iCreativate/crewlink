import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { bookJobsFromCrewTemplate } from "@/api/crew-templates";
import { jobCreateSchema } from "@/lib/validations";
import { emitToJobsRoom } from "@/lib/socket-global";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Only media houses can book crews." }, { status: 403 });
  }

  const { id: templateId } = await ctx.params;
  const body = await req.json();
  const parsed = jobCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, budgetMin, budgetMax, location, startsAt, payRate, gearRequirements } = parsed.data;
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    return NextResponse.json({ error: "Budget min cannot exceed max." }, { status: 400 });
  }

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid date/time." }, { status: 400 });
  }

  try {
    const result = await bookJobsFromCrewTemplate({
      templateId,
      ownerId: auth.appUser.id,
      jobBase: {
        title,
        description: description ?? "",
        location,
        startsAt: startDate,
        payRate,
        gearRequirements,
        budgetMin,
        budgetMax,
      },
    });

    if (!result.ok) {
      if (result.code === "not_found") return NextResponse.json({ error: "Template not found." }, { status: 404 });
      return NextResponse.json({ error: "Template has no roles." }, { status: 400 });
    }

    for (const job of result.jobs) {
      emitToJobsRoom("job:new", job);
    }

    return NextResponse.json({ jobs: result.jobs }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "invalid_freelancer") {
      return NextResponse.json({ error: "Assigned freelancer is invalid." }, { status: 400 });
    }
    throw e;
  }
}
