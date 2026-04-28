import { prisma } from "@/lib/prisma";
import { DiscoverySidebar } from "@/components/sidebar/DiscoverySidebar";

export async function RightRailServer({ viewerId }: { viewerId: string }) {
  const bts = await prisma.feedPost.findMany({
    where: { authorId: viewerId, bts: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 3,
    select: { id: true, body: true, mediaUrl: true, mediaType: true, createdAt: true },
  });

  const trendingAgg = await prisma.feedPost.groupBy({
    by: ["authorId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 3,
  });
  const trendingIds = trendingAgg.map((r) => r.authorId);
  const trendingUsers = trendingIds.length
    ? await prisma.user.findMany({
        where: { id: { in: trendingIds } },
        select: { id: true, name: true, image: true, role: true, profile: { select: { headline: true } } },
      })
    : [];
  const trendingById = new Map(trendingUsers.map((u) => [u.id, u]));
  const trending = trendingIds.map((id) => trendingById.get(id)).filter(Boolean);
  const followingRows = trendingIds.length
    ? await prisma.userFollow.findMany({
        where: { followerId: viewerId, followingId: { in: trendingIds } },
        select: { followingId: true },
      })
    : [];
  const followingSet = new Set(followingRows.map((r) => r.followingId));

  return (
    <DiscoverySidebar
      viewerId={viewerId}
      bts={bts.map((p) => ({ id: p.id, body: p.body, mediaUrl: p.mediaUrl }))}
      trending={trending.map((u) => ({
        id: u!.id,
        name: u!.name,
        image: u!.image,
        role: u!.role,
        headline: u!.profile?.headline ?? null,
      }))}
      followingSet={followingSet}
    />
  );
}

