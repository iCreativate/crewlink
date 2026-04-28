import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getPublicProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      profile: true,
      portfolioItems: {
        orderBy: { createdAt: "desc" },
        take: 24,
      },
      jobsPosted: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          location: true,
          payRate: true,
          status: true,
          createdAt: true,
        },
      },
      feedPosts: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          _count: { select: { likes: true, shares: true } },
          sharedPost: {
            include: {
              author: { select: { id: true, name: true, image: true, role: true, profile: { select: { headline: true, specializations: true } } } },
              _count: { select: { likes: true, shares: true } },
            },
          },
        },
      },
    },
  });
}

export async function upsertProfileForUser(
  userId: string,
  data: {
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    companyName?: string | null | undefined;
    specializations?: string[] | undefined;
    gearTags?: string[] | undefined;
    availableNow?: boolean | undefined;
  },
) {
  const create: Prisma.ProfileCreateInput = {
    user: { connect: { id: userId } },
    headline: data.headline ?? undefined,
    bio: data.bio ?? undefined,
    location: data.location ?? undefined,
    website: data.website === null ? undefined : data.website || undefined,
    companyName: data.companyName === undefined ? undefined : data.companyName,
    specializations: data.specializations ?? [],
    gearTags: data.gearTags ?? [],
    availableNow: data.availableNow ?? false,
  };

  const update: Prisma.ProfileUpdateInput = {};
  if (data.headline !== undefined) update.headline = data.headline;
  if (data.bio !== undefined) update.bio = data.bio;
  if (data.location !== undefined) update.location = data.location;
  if (data.website !== undefined) update.website = data.website;
  if (data.companyName !== undefined) update.companyName = data.companyName;
  if (data.specializations !== undefined) update.specializations = { set: data.specializations };
  if (data.gearTags !== undefined) update.gearTags = { set: data.gearTags };
  if (data.availableNow !== undefined) update.availableNow = data.availableNow;

  return prisma.profile.upsert({
    where: { userId },
    create,
    update,
  });
}
