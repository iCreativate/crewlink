import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

const posterSelect = {
  id: true,
  name: true,
  role: true,
  image: true,
} as const;

const accepterSelect = {
  id: true,
  name: true,
  image: true,
} as const;

export function listOpenJobsForFeed(viewer?: { id: string; role: UserRole } | null) {
  return listOpenJobsForFeedWithLocation(viewer, null);
}

function buildLocationOr(near: string) {
  const cleaned = near
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length >= 3)
    .slice(0, 4);

  if (!cleaned.length) return null;

  return cleaned.map((q) => ({ location: { contains: q, mode: "insensitive" as const } }));
}

export function listOpenJobsForFeedWithLocation(
  viewer: { id: string; role: UserRole } | null | undefined,
  near: string | null,
) {
  const publicBoardOnly = !viewer || viewer.role !== "FREELANCER";
  const nearOr = near ? buildLocationOr(near) : null;

  return prisma.job.findMany({
    where: {
      status: "OPEN",
      ...(publicBoardOnly
        ? { invitedFreelancerId: null }
        : {
            OR: [{ invitedFreelancerId: null }, { invitedFreelancerId: viewer.id }],
          }),
      ...(nearOr ? { AND: [{ location: { not: null } }, { OR: nearOr }] } : {}),
    },
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { poster: { select: posterSelect } },
  });
}

export function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      poster: {
        select: {
          ...posterSelect,
          email: true,
          profile: true,
        },
      },
      acceptedBy: { select: accepterSelect },
    },
  });
}

export async function createJobForPoster(
  input: {
    posterId: string;
    title: string;
    description: string;
    location?: string | null;
    startsAt: Date;
    payRate: string;
    gearRequirements: string[];
    budgetMin?: number | null;
    budgetMax?: number | null;
    invitedFreelancerId?: string | null;
    crewRoleLabel?: string | null;
    emergencyMode?: boolean;
  },
  db: DbClient = prisma,
) {
  return db.job.create({
    data: {
      title: input.title,
      description: input.description || "",
      location: input.location ?? undefined,
      startsAt: input.startsAt,
      payRate: input.payRate,
      gearRequirements: input.gearRequirements,
      budgetMin: input.budgetMin ?? undefined,
      budgetMax: input.budgetMax ?? undefined,
      posterId: input.posterId,
      invitedFreelancerId: input.invitedFreelancerId ?? undefined,
      crewRoleLabel: input.crewRoleLabel ?? undefined,
      emergencyMode: input.emergencyMode ?? false,
    },
    include: { poster: { select: posterSelect } },
  });
}

export async function activateJobEmergency(jobId: string, posterId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, posterId, status: "OPEN" } });
  if (!job) return { ok: false as const, code: "not_found" as const };
  if (job.invitedFreelancerId) return { ok: false as const, code: "invited_only" as const };

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { emergencyMode: true },
    include: { poster: { select: posterSelect } },
  });
  return { ok: true as const, job: updated };
}

export async function updateJobStatus(jobId: string, posterId: string, status: "OPEN" | "FILLED" | "CLOSED") {
  const job = await prisma.job.findFirst({ where: { id: jobId, posterId } });
  if (!job) return null;
  return prisma.job.update({
    where: { id: jobId },
    data: { status },
    include: { poster: { select: posterSelect }, acceptedBy: { select: accepterSelect } },
  });
}

export type AcceptJobResult =
  | { ok: true; job: NonNullable<Awaited<ReturnType<typeof getJobById>>> }
  | { ok: false; code: "not_found" | "own_job" | "not_open" | "race_lost" | "not_invited" };

export async function acceptJobAtomic(jobId: string, freelancerId: string): Promise<AcceptJobResult> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, code: "not_found" };
  if (job.posterId === freelancerId) return { ok: false, code: "own_job" };
  if (job.status !== "OPEN") return { ok: false, code: "not_open" };
  if (job.invitedFreelancerId && job.invitedFreelancerId !== freelancerId) {
    return { ok: false, code: "not_invited" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const n = await tx.job.updateMany({
      where: { id: jobId, status: "OPEN" },
      data: {
        status: "FILLED",
        acceptedById: freelancerId,
        acceptedAt: new Date(),
      },
    });
    if (n.count === 0) return null;
    return tx.job.findUnique({
      where: { id: jobId },
      include: {
        poster: { select: { ...posterSelect, email: true, profile: true } },
        acceptedBy: { select: accepterSelect },
      },
    });
  });

  if (!updated) return { ok: false, code: "race_lost" };
  return { ok: true, job: updated };
}

export type ApplyJobResult =
  | { ok: true }
  | { ok: false; code: "not_found" | "own_job" | "not_open" | "not_invited" | "already_applied" };

export async function applyToJob(input: {
  jobId: string;
  freelancerId: string;
  proposal: string;
}): Promise<ApplyJobResult> {
  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job) return { ok: false, code: "not_found" };
  if (job.posterId === input.freelancerId) return { ok: false, code: "own_job" };
  if (job.status !== "OPEN") return { ok: false, code: "not_open" };
  if (job.invitedFreelancerId && job.invitedFreelancerId !== input.freelancerId) return { ok: false, code: "not_invited" };

  try {
    await prisma.jobApplication.create({
      data: { jobId: input.jobId, userId: input.freelancerId, proposal: input.proposal },
    });
    return { ok: true };
  } catch (e: unknown) {
    // unique(jobId,userId)
    if (e && typeof e === "object" && "code" in e && (e as { code?: unknown }).code === "P2002") {
      return { ok: false, code: "already_applied" };
    }
    throw e;
  }
}

export function listApplicationsForJob(jobId: string) {
  return prisma.jobApplication.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { headline: true, specializations: true, location: true } },
        },
      },
    },
  });
}
