import { prisma } from "@/lib/prisma";
import type { MediaType } from "@prisma/client";

const userSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
  profile: { select: { headline: true, specializations: true } },
} as const;

export type FeedPage = { items: unknown[]; nextCursor: string | null };

export async function listFeed(input: {
  take: number;
  cursor?: string | null;
  viewerId?: string | null;
  collabOnly?: boolean;
}) {
  const take = Math.min(Math.max(input.take, 1), 60);
  const now = new Date();
  const baseInclude = {
    author: { select: userSelect },
    mediaItems: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] as any },
    sharedPost: {
      include: {
        author: { select: userSelect },
        mediaItems: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] as any },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 2,
          include: { author: { select: { name: true, role: true } } },
        },
        _count: { select: { likes: true, shares: true, comments: true } },
        ...(input.viewerId ? { likes: { where: { userId: input.viewerId }, select: { id: true } } } : {}),
      },
    },
    comments: {
      orderBy: { createdAt: "desc" },
      take: 2,
      include: { author: { select: { name: true, role: true } } },
    },
    _count: { select: { likes: true, shares: true, comments: true } },
    ...(input.viewerId ? { likes: { where: { userId: input.viewerId }, select: { id: true } } } : {}),
  } as const;

  // Page 1: always pin active boosted posts to the top.
  if (!input.cursor) {
    const boosted = await prisma.feedPost.findMany({
      where: {
        ...(input.collabOnly ? { collab: true } : {}),
        boostedUntil: { gt: now },
      },
      orderBy: [{ boostedUntil: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: Math.min(8, take),
      include: baseInclude,
    });

    const boostedIds = boosted.map((b) => b.id);
    const remaining = take - boosted.length;

    const rest = await prisma.feedPost.findMany({
      where: {
        ...(input.collabOnly ? { collab: true } : {}),
        ...(boostedIds.length ? { id: { notIn: boostedIds } } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: remaining + 1,
      include: baseInclude,
    });

    const rows = [...boosted, ...rest];
    const hasMore = rest.length > remaining;
    const items = hasMore ? rows.slice(0, boosted.length + remaining) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    const postIds = items.map((p) => p.id);
    const reactionAgg = postIds.length
      ? await prisma.feedPostReaction.groupBy({
          by: ["postId", "type"],
          where: { postId: { in: postIds } },
          _count: { _all: true },
        })
      : [];
    const viewerReactions = input.viewerId && postIds.length
      ? await prisma.feedPostReaction.findMany({
          where: { postId: { in: postIds }, userId: input.viewerId },
          select: { postId: true, type: true },
        })
      : [];
    const viewerReactionByPost = new Map(viewerReactions.map((r) => [r.postId, r.type]));
    const reactionCountsByPost = new Map<string, Record<string, number>>();
    for (const r of reactionAgg) {
      const cur = reactionCountsByPost.get(r.postId) ?? {};
      cur[r.type] = r._count._all;
      reactionCountsByPost.set(r.postId, cur);
    }

    return {
      items: items.map((p) => {
        const shared = p.sharedPost
          ? {
              ...p.sharedPost,
              mediaItems:
                p.sharedPost.mediaItems?.length
                  ? p.sharedPost.mediaItems.map((m) => ({ mediaType: m.mediaType, url: m.url, sortOrder: m.sortOrder }))
                  : p.sharedPost.mediaType && p.sharedPost.mediaUrl
                    ? [{ mediaType: p.sharedPost.mediaType, url: p.sharedPost.mediaUrl, sortOrder: 0 }]
                    : [],
              likedByViewer: input.viewerId ? p.sharedPost.likes.length > 0 : false,
              likesCount: p.sharedPost._count.likes,
              commentsCount: p.sharedPost._count.comments,
              sharesCount: p.sharedPost._count.shares,
              commentsPreview: (p.sharedPost.comments ?? []).map((c) => ({
                id: c.id,
                authorName: c.author.name ?? "User",
                authorRole: c.author.role,
                body: c.body,
              })),
              likes: undefined,
              comments: undefined,
              _count: undefined,
            }
          : null;

        return {
          ...p,
          mediaItems:
            p.mediaItems?.length
              ? p.mediaItems.map((m) => ({ mediaType: m.mediaType, url: m.url, sortOrder: m.sortOrder }))
              : p.mediaType && p.mediaUrl
                ? [{ mediaType: p.mediaType, url: p.mediaUrl, sortOrder: 0 }]
                : [],
          boostedActive: Boolean(p.boostedUntil && p.boostedUntil.getTime() > now.getTime()),
          viewerReaction: viewerReactionByPost.get(p.id) ?? null,
          reactionCounts: reactionCountsByPost.get(p.id) ?? {},
          likedByViewer: input.viewerId ? p.likes.length > 0 : false,
          likesCount: p._count.likes,
          commentsCount: p._count.comments,
          sharesCount: p._count.shares,
          sharedPost: shared,
          commentsPreview: (p.comments ?? []).map((c) => ({
            id: c.id,
            authorName: c.author.name ?? "User",
            authorRole: c.author.role,
            body: c.body,
          })),
          likes: undefined,
          comments: undefined,
          _count: undefined,
        };
      }),
      nextCursor,
    };
  }

  // Cursor pages: paginate normally.
  const rows = await prisma.feedPost.findMany({
    ...(input.collabOnly ? { where: { collab: true } } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: baseInclude,
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  const postIds = items.map((p) => p.id);
  const reactionAgg = postIds.length
    ? await prisma.feedPostReaction.groupBy({
        by: ["postId", "type"],
        where: { postId: { in: postIds } },
        _count: { _all: true },
      })
    : [];
  const viewerReactions = input.viewerId && postIds.length
    ? await prisma.feedPostReaction.findMany({
        where: { postId: { in: postIds }, userId: input.viewerId },
        select: { postId: true, type: true },
      })
    : [];
  const viewerReactionByPost = new Map(viewerReactions.map((r) => [r.postId, r.type]));
  const reactionCountsByPost = new Map<string, Record<string, number>>();
  for (const r of reactionAgg) {
    const cur = reactionCountsByPost.get(r.postId) ?? {};
    cur[r.type] = r._count._all;
    reactionCountsByPost.set(r.postId, cur);
  }

  return {
    items: items.map((p) => {
      const shared = p.sharedPost
        ? {
            ...p.sharedPost,
            mediaItems:
              p.sharedPost.mediaItems?.length
                ? p.sharedPost.mediaItems.map((m) => ({ mediaType: m.mediaType, url: m.url, sortOrder: m.sortOrder }))
                : p.sharedPost.mediaType && p.sharedPost.mediaUrl
                  ? [{ mediaType: p.sharedPost.mediaType, url: p.sharedPost.mediaUrl, sortOrder: 0 }]
                  : [],
            likedByViewer: input.viewerId ? p.sharedPost.likes.length > 0 : false,
            likesCount: p.sharedPost._count.likes,
            commentsCount: p.sharedPost._count.comments,
            sharesCount: p.sharedPost._count.shares,
            commentsPreview: (p.sharedPost.comments ?? []).map((c) => ({
              id: c.id,
              authorName: c.author.name ?? "User",
              authorRole: c.author.role,
              body: c.body,
            })),
            likes: undefined,
            comments: undefined,
            _count: undefined,
          }
        : null;

      return {
        ...p,
        mediaItems:
          p.mediaItems?.length
            ? p.mediaItems.map((m) => ({ mediaType: m.mediaType, url: m.url, sortOrder: m.sortOrder }))
            : p.mediaType && p.mediaUrl
              ? [{ mediaType: p.mediaType, url: p.mediaUrl, sortOrder: 0 }]
              : [],
        boostedActive: Boolean(p.boostedUntil && p.boostedUntil.getTime() > now.getTime()),
        viewerReaction: viewerReactionByPost.get(p.id) ?? null,
        reactionCounts: reactionCountsByPost.get(p.id) ?? {},
        likedByViewer: input.viewerId ? p.likes.length > 0 : false,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        sharesCount: p._count.shares,
        sharedPost: shared,
        commentsPreview: (p.comments ?? []).map((c) => ({
          id: c.id,
          authorName: c.author.name ?? "User",
          authorRole: c.author.role,
          body: c.body,
        })),
        likes: undefined,
        comments: undefined,
        _count: undefined,
      };
    }),
    nextCursor,
  };
}

export async function createFeedPost(input: {
  authorId: string;
  body: string;
  mediaType?: MediaType | null;
  mediaUrl?: string | null;
  mediaItems?: Array<{ mediaType: MediaType; url: string }> | null;
  kind?: "POST" | "AD";
  adType?: "SPONSORED_POST" | "OPPORTUNITY" | "FEATURED_CREATOR" | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  bts?: boolean;
  collab?: boolean | null;
  collabNote?: string | null;
  location?: string | null;
  collaborators?: string[];
}) {
  return prisma.feedPost.create({
    data: {
      authorId: input.authorId,
      body: input.body,
      mediaType: input.mediaType ?? undefined,
      mediaUrl: input.mediaUrl ?? undefined,
      kind: (input.kind as any) ?? undefined,
      adType: (input.adType as any) ?? undefined,
      ctaLabel: input.ctaLabel ?? undefined,
      ctaHref: input.ctaHref ?? undefined,
      bts: input.bts ?? undefined,
      collab: input.collab ?? undefined,
      collabNote: input.collabNote ?? undefined,
      location: input.location ?? undefined,
      collaborators: input.collaborators ?? undefined,
      ...(input.mediaItems?.length
        ? {
            mediaItems: {
              create: input.mediaItems.map((m, idx) => ({
                mediaType: m.mediaType,
                url: m.url,
                sortOrder: idx,
              })),
            },
          }
        : {}),
    },
    include: {
      author: { select: userSelect },
      mediaItems: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      _count: { select: { likes: true, shares: true, comments: true } },
    },
  });
}

export async function createFeedPostComment(input: { postId: string; authorId: string; body: string }) {
  return prisma.feedPostComment.create({
    data: { postId: input.postId, authorId: input.authorId, body: input.body },
    include: { author: { select: { id: true, name: true, role: true, image: true } } },
  });
}

export async function listFeedPostComments(input: { postId: string; take?: number }) {
  const take = Math.min(Math.max(input.take ?? 20, 1), 60);
  return prisma.feedPostComment.findMany({
    where: { postId: input.postId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    include: { author: { select: { id: true, name: true, role: true, image: true } } },
  });
}

export async function likeFeedPost(postId: string, userId: string) {
  await prisma.feedPostLike.upsert({
    where: { postId_userId: { postId, userId } },
    create: { postId, userId },
    update: {},
  });
  const counts = await prisma.feedPost.findUnique({
    where: { id: postId },
    select: { _count: { select: { likes: true, shares: true, comments: true } } },
  });
  return { likesCount: counts?._count.likes ?? 0, sharesCount: counts?._count.shares ?? 0, commentsCount: counts?._count.comments ?? 0 };
}

export async function unlikeFeedPost(postId: string, userId: string) {
  await prisma.feedPostLike.deleteMany({ where: { postId, userId } });
  const counts = await prisma.feedPost.findUnique({
    where: { id: postId },
    select: { _count: { select: { likes: true, shares: true, comments: true } } },
  });
  return { likesCount: counts?._count.likes ?? 0, sharesCount: counts?._count.shares ?? 0, commentsCount: counts?._count.comments ?? 0 };
}

export async function shareFeedPost(input: { authorId: string; postId: string; body?: string | null }) {
  const original = await prisma.feedPost.findUnique({ where: { id: input.postId }, select: { id: true } });
  if (!original) return null;

  return prisma.feedPost.create({
    data: {
      authorId: input.authorId,
      body: (input.body ?? "").trim(),
      sharedPostId: input.postId,
    },
    include: {
      author: { select: userSelect },
      sharedPost: {
        include: {
          author: { select: userSelect },
          _count: { select: { likes: true, shares: true } },
        },
      },
      _count: { select: { likes: true, shares: true } },
    },
  });
}

