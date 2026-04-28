import { NextResponse } from "next/server";
import { acceptJobAtomic } from "@/api/jobs";
import { getAuthContext } from "@/lib/auth/server";
import { emitToJobsRoom } from "@/lib/socket-global";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authCtx = await getAuthContext();
  if (!authCtx?.appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (authCtx.appUser.role !== "FREELANCER") {
    return NextResponse.json({ error: "Only freelancers can accept jobs." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const result = await acceptJobAtomic(id, authCtx.appUser.id);

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "own_job" || result.code === "not_invited"
          ? 403
          : result.code === "not_open" || result.code === "race_lost"
            ? 409
            : 400;
    return NextResponse.json({ error: result.code }, { status });
  }

  emitToJobsRoom("job:filled", { jobId: id, job: result.job });

  return NextResponse.json(result.job);
}
