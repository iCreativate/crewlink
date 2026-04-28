import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.appUser.role !== "MEDIA_HOUSE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: jobId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (job.posterId !== auth.appUser.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (job.status !== "OPEN") return NextResponse.json({ error: "not_open" }, { status: 409 });

  const app = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId, userId: parsed.data.userId } },
    select: { id: true },
  });
  if (!app) return NextResponse.json({ error: "not_applicant" }, { status: 404 });

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { invitedFreelancerId: parsed.data.userId },
    select: { id: true, invitedFreelancerId: true },
  });

  await prisma.notification.create({
    data: {
      userId: parsed.data.userId,
      type: "job_offer",
      title: "New job offer",
      body: "A media house approved your application and sent you an offer.",
      href: `/jobs/${jobId}`,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.appUser.role !== "MEDIA_HOUSE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: jobId } = await ctx.params;
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { posterId: true, status: true } });
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (job.posterId !== auth.appUser.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (job.status !== "OPEN") return NextResponse.json({ error: "not_open" }, { status: 409 });

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { invitedFreelancerId: null },
    select: { id: true, invitedFreelancerId: true },
  });

  return NextResponse.json(updated);
}

