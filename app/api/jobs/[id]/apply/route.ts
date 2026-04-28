import { NextResponse } from "next/server";
import { z } from "zod";
import { applyToJob } from "@/api/jobs";
import { getAuthContext } from "@/lib/auth/server";
import { emitToJobsRoom } from "@/lib/socket-global";

const schema = z.object({
  proposal: z.string().trim().min(30).max(4000),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authCtx = await getAuthContext();
  if (!authCtx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (authCtx.appUser.role !== "FREELANCER") {
    return NextResponse.json({ error: "Only freelancers can apply." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await applyToJob({ jobId: id, freelancerId: authCtx.appUser.id, proposal: parsed.data.proposal });
  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "own_job" || result.code === "not_invited"
          ? 403
          : result.code === "already_applied"
            ? 409
            : result.code === "not_open"
              ? 409
              : 400;
    return NextResponse.json({ error: result.code }, { status });
  }

  // Notify media house dashboards/feed to refresh (non-breaking if unused)
  emitToJobsRoom("job:patch", { jobId: id });

  return NextResponse.json({ ok: true }, { status: 201 });
}

