import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { FeedList } from "@/components/feed/FeedList";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { RightRailServer } from "@/components/feed/RightRail.server";
import { AppShell } from "@/components/layout/AppShell";
import { MobileNav } from "@/components/layout/MobileNav";
import { ProfileSidebar } from "@/components/sidebar/ProfileSidebar";

export default async function FeedPage() {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) redirect("/login?callbackUrl=/feed");

  const user = await prisma.user.findUnique({
    where: { id: ctx.appUser.id },
    include: { profile: true, _count: { select: { feedPosts: true, crewTemplates: true } } },
  });

  const displayName = user?.name ?? ctx.appUser.name ?? "You";
  const headline =
    user?.profile?.headline?.trim() ||
    (ctx.appUser.role === "MEDIA_HOUSE" ? "Media house" : "Freelancer") ||
    "Crew";
  const location = user?.profile?.location?.trim() || "South Africa";
  const postsCount = user?._count.feedPosts ?? 0;
  const collabPostsCount = await prisma.feedPost.count({ where: { authorId: ctx.appUser.id, collab: true } });

  return (
    <AppShell>
      <div className="page-grid">
        <ProfileSidebar
          user={{
            id: ctx.appUser.id,
            name: displayName,
            headline,
            image: user?.image ?? null,
            location,
          }}
          stats={{
            posts: postsCount.toLocaleString(),
            collabs: collabPostsCount.toLocaleString(),
            location,
          }}
        />

          {/* Main feed */}
          <main className="order-1 space-y-6 lg:order-none">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="section-title text-zinc-900 dark:text-white">Community feed</h2>
                <p className="meta-text mt-1">
                  A South African production network — like LinkedIn meets set life.
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <FeedTabs />
              </div>
            </div>

            <FeedComposer viewer={{ name: displayName, image: user?.image ?? null }} viewerRole={ctx.appUser.role} />
            <FeedList />
          </main>

          <RightRailServer viewerId={ctx.appUser.id} />
      </div>

      <MobileNav userId={ctx.appUser.id} />
    </AppShell>
  );
}

