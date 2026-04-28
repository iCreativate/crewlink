import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createJobForPoster } from "@/api/jobs";

const assigneeSelect = { id: true, name: true, image: true } as const;

export async function assertFreelancerIds(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (unique.length === 0) return;
  const users = await prisma.user.findMany({
    where: { id: { in: unique }, role: "FREELANCER" },
    select: { id: true },
  });
  if (users.length !== unique.length) {
    throw new Error("invalid_freelancer");
  }
}

export function listCrewTemplatesForOwner(ownerId: string) {
  return prisma.crewTemplate.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: {
      roles: {
        orderBy: { sortOrder: "asc" },
        include: { assignedFreelancer: { select: assigneeSelect } },
      },
    },
  });
}

export function getCrewTemplateForOwner(id: string, ownerId: string) {
  return prisma.crewTemplate.findFirst({
    where: { id, ownerId },
    include: {
      roles: {
        orderBy: { sortOrder: "asc" },
        include: { assignedFreelancer: { select: assigneeSelect } },
      },
    },
  });
}

export async function createCrewTemplate(
  ownerId: string,
  input: { name: string; description?: string | null; roles: { roleName: string; assignedFreelancerId?: string | null }[] },
) {
  await assertFreelancerIds(input.roles.map((r) => r.assignedFreelancerId));
  return prisma.crewTemplate.create({
    data: {
      ownerId,
      name: input.name,
      description: input.description ?? undefined,
      roles: {
        create: input.roles.map((r, i) => ({
          roleName: r.roleName.trim(),
          sortOrder: i,
          assignedFreelancerId: r.assignedFreelancerId ?? undefined,
        })),
      },
    },
    include: {
      roles: {
        orderBy: { sortOrder: "asc" },
        include: { assignedFreelancer: { select: assigneeSelect } },
      },
    },
  });
}

export async function updateCrewTemplate(
  id: string,
  ownerId: string,
  input: { name: string; description?: string | null; roles: { roleName: string; assignedFreelancerId?: string | null }[] },
) {
  await assertFreelancerIds(input.roles.map((r) => r.assignedFreelancerId));
  const existing = await prisma.crewTemplate.findFirst({ where: { id, ownerId }, select: { id: true } });
  if (!existing) return null;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.crewTemplateRole.deleteMany({ where: { templateId: id } });
    await tx.crewTemplate.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description ?? null,
        roles: {
          create: input.roles.map((r, i) => ({
            roleName: r.roleName.trim(),
            sortOrder: i,
            assignedFreelancerId: r.assignedFreelancerId ?? undefined,
          })),
        },
      },
    });
    return tx.crewTemplate.findUniqueOrThrow({
      where: { id },
      include: {
        roles: {
          orderBy: { sortOrder: "asc" },
          include: { assignedFreelancer: { select: assigneeSelect } },
        },
      },
    });
  });
}

export async function deleteCrewTemplate(id: string, ownerId: string) {
  const r = await prisma.crewTemplate.deleteMany({ where: { id, ownerId } });
  return r.count > 0;
}

export type BookCrewJobBase = {
  title: string;
  description: string;
  location?: string | null;
  startsAt: Date;
  payRate: string;
  gearRequirements: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
};

export async function bookJobsFromCrewTemplate(input: { templateId: string; ownerId: string; jobBase: BookCrewJobBase }) {
  const template = await prisma.crewTemplate.findFirst({
    where: { id: input.templateId, ownerId: input.ownerId },
    include: { roles: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) return { ok: false as const, code: "not_found" as const };
  if (template.roles.length === 0) return { ok: false as const, code: "no_roles" as const };

  await assertFreelancerIds(template.roles.map((r) => r.assignedFreelancerId));

  const jobs = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const role of template.roles) {
      const job = await createJobForPoster(
        {
          posterId: input.ownerId,
          title: `${input.jobBase.title} — ${role.roleName}`,
          description: input.jobBase.description,
          location: input.jobBase.location,
          startsAt: input.jobBase.startsAt,
          payRate: input.jobBase.payRate,
          gearRequirements: input.jobBase.gearRequirements,
          budgetMin: input.jobBase.budgetMin,
          budgetMax: input.jobBase.budgetMax,
          invitedFreelancerId: role.assignedFreelancerId,
          crewRoleLabel: role.roleName,
        },
        tx,
      );
      created.push(job);
    }
    return created;
  });

  return { ok: true as const, jobs };
}
