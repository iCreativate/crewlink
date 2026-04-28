import { prisma } from "@/lib/prisma";
import type { MediaType } from "@prisma/client";

const userSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
  profile: { select: { headline: true, specializations: true } },
} as const;

export async function listPortfolioFeed(input: {
  take: number;
  cursor?: string | null;
  viewerId?: string | null;
}) {
  const take = Math.min(Math.max(input.take, 1), 60);
  const rows = await prisma.portfolioItem.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: {
      user: { select: userSelect },
      _count: { select: { likes: true, saves: true } },
      ...(input.viewerId
        ? {
            likes: { where: { userId: input.viewerId }, select: { id: true } },
            saves: { where: { userId: input.viewerId }, select: { id: true } },
          }
        : {}),
    },
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return {
    items: items.map((it) => ({
      ...it,
      likedByViewer: input.viewerId ? it.likes.length > 0 : false,
      savedByViewer: input.viewerId ? it.saves.length > 0 : false,
      likesCount: it._count.likes,
      savesCount: it._count.saves,
      // strip relation arrays to keep payload small
      likes: undefined,
      saves: undefined,
      _count: undefined,
    })),
    nextCursor,
  };
}

export function listPortfolioForUser(userId: string) {
  return prisma.portfolioItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: userSelect } },
  });
}

export async function createPortfolioItem(input: {
  userId: string;
  title?: string | null;
  description?: string | null;
  gearTags?: string[] | null;
  url: string;
  mediaType: MediaType;
}) {
  return prisma.portfolioItem.create({
    data: {
      userId: input.userId,
      title: input.title ?? undefined,
      description: input.description ?? undefined,
      gearTags: input.gearTags ?? undefined,
      url: input.url,
      mediaType: input.mediaType,
    },
    include: { user: { select: userSelect } },
  });
}

export async function deletePortfolioItem(id: string, userId: string) {
  const row = await prisma.portfolioItem.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.portfolioItem.delete({ where: { id } });
  return true;
}

export async function likePortfolioItem(itemId: string, userId: string) {
  await prisma.portfolioLike.upsert({
    where: { itemId_userId: { itemId, userId } },
    create: { itemId, userId },
    update: {},
  });
  const counts = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    select: { _count: { select: { likes: true, saves: true } } },
  });
  return { likesCount: counts?._count.likes ?? 0, savesCount: counts?._count.saves ?? 0 };
}

export async function unlikePortfolioItem(itemId: string, userId: string) {
  await prisma.portfolioLike.deleteMany({ where: { itemId, userId } });
  const counts = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    select: { _count: { select: { likes: true, saves: true } } },
  });
  return { likesCount: counts?._count.likes ?? 0, savesCount: counts?._count.saves ?? 0 };
}

export async function savePortfolioItem(itemId: string, userId: string) {
  await prisma.portfolioSave.upsert({
    where: { itemId_userId: { itemId, userId } },
    create: { itemId, userId },
    update: {},
  });
  const counts = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    select: { _count: { select: { likes: true, saves: true } } },
  });
  return { likesCount: counts?._count.likes ?? 0, savesCount: counts?._count.saves ?? 0 };
}

export async function unsavePortfolioItem(itemId: string, userId: string) {
  await prisma.portfolioSave.deleteMany({ where: { itemId, userId } });
  const counts = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    select: { _count: { select: { likes: true, saves: true } } },
  });
  return { likesCount: counts?._count.likes ?? 0, savesCount: counts?._count.saves ?? 0 };
}
