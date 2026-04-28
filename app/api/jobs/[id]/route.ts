import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/server";
import { getJobById, updateJobStatus } from "@/api/jobs";
import { emitToJobsRoom } from "@/lib/socket-global";

const patchSchema = z.object({
  status: z.enum(["OPEN", "FILLED", "CLOSED"]),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = await getJobById(id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authCtx = await getAuthContext();
  if (!authCtx?.appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateJobStatus(id, authCtx.appUser.id, parsed.data.status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.status === "FILLED" || parsed.data.status === "CLOSED") {
    emitToJobsRoom("job:filled", { jobId: id, job: updated });
  }

  return NextResponse.json(updated);
}
