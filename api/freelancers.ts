import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type FreelancerListFilters = {
  specializations: string[];
  gearTags: string[];
  availableOnly: boolean;
  search?: string | null;
};

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
}

export async function listFreelancers(filters: FreelancerListFilters, take = 48) {
  const specs = filters.specializations.filter(Boolean);
  const gears = normalizeTags(filters.gearTags);

  const conditions: Prisma.ProfileWhereInput[] = [];
  if (specs.length > 0) conditions.push({ specializations: { hasSome: specs } });
  if (gears.length > 0) conditions.push({ gearTags: { hasSome: gears } });
  if (filters.availableOnly) conditions.push({ availableNow: true });

  const search = filters.search?.trim();
  const where: Prisma.UserWhereInput = {
    role: "FREELANCER",
    profile: conditions.length > 0 ? { is: { AND: conditions } } : { isNot: null },
    ...(search
      ? {
          name: { contains: search, mode: "insensitive" },
        }
      : {}),
  };

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      profile: true,
    },
    orderBy: [{ profile: { availableNow: "desc" } }, { updatedAt: "desc" }],
    take,
  });
}

export async function distinctGearTagsForFilters(limit = 80) {
  const rows = await prisma.$queryRaw<{ tag: string }[]>`
    SELECT DISTINCT UNNEST("gearTags") AS tag
    FROM "Profile"
    WHERE CARDINALITY("gearTags") > 0
    LIMIT ${limit}
  `;
  return rows
    .map((r) => r.tag)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
