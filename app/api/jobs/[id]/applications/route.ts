import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getJobById, listApplicationsForJob } from "@/api/jobs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const job = await getJobById(id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (job.posterId !== auth.appUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listApplicationsForJob(id);
  return NextResponse.json({ items: rows });
}

