import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/server";

const postSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

async function canViewJobThread(jobId: string, viewerId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { posterId: true, acceptedById: true, invitedFreelancerId: true },
  });
  if (!job) return { ok: false as const, code: "not_found" as const, job: null };
  if (job.posterId === viewerId) return { ok: true as const, job };
  if (job.acceptedById === viewerId) return { ok: true as const, job };
  if (job.invitedFreelancerId === viewerId) return { ok: true as const, job };
  const app = await prisma.jobApplication.findFirst({ where: { jobId, userId: viewerId }, select: { id: true } });
  if (app) return { ok: true as const, job };
  return { ok: false as const, code: "forbidden" as const, job };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: jobId } = await params;
  const authz = await canViewJobThread(jobId, ctx.appUser.id);
  if (!authz.ok) return NextResponse.json({ error: authz.code }, { status: authz.code === "not_found" ? 404 : 403 });

  const items = await prisma.jobMessage.findMany({
    where: {
      jobId,
      OR: [{ senderId: ctx.appUser.id }, { recipientId: ctx.appUser.id }],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 200,
    include: { sender: { select: { id: true, name: true, image: true, role: true } } },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: jobId } = await params;
  const authz = await canViewJobThread(jobId, ctx.appUser.id);
  if (!authz.ok || !authz.job) return NextResponse.json({ error: authz.ok ? "not_found" : authz.code }, { status: authz.code === "not_found" ? 404 : 403 });

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const viewerId = ctx.appUser.id;
  const recipientId = viewerId === authz.job.posterId ? authz.job.acceptedById : authz.job.posterId;
  if (!recipientId) {
    return NextResponse.json({ error: "no_recipient" }, { status: 409 });
  }

  const created = await prisma.jobMessage.create({
    data: { jobId, senderId: viewerId, recipientId, body: parsed.data.body },
    include: { sender: { select: { id: true, name: true, image: true, role: true } } },
  });

  return NextResponse.json(created, { status: 201 });
}

