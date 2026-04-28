import Link from "next/link";
import { CreatorCard } from "@/components/sidebar/CreatorCard";
import { OpportunityCard } from "@/components/sidebar/OpportunityCard";
import { featuredOpportunities } from "@/lib/opportunities";

export function DiscoverySidebar({
  bts,
  trending,
  viewerId,
  followingSet,
}: {
  viewerId: string;
  bts: Array<{ id: string; body: string; mediaUrl: string | null }>;
  trending: Array<{ id: string; name: string | null; image: string | null; role: string; headline?: string | null }>;
  followingSet: Set<string>;
}) {
  return (
    <aside className="right-sidebar">
      <div className="space-y-6">
        <div className="sidebar-card">
          <p className="text-sm font-semibold text-white">Behind the scenes</p>
          <p className="meta-text mt-1">Your Show & Tell posts — how you made the work.</p>

          <div className="mt-4 grid gap-3">
            {bts.length ? (
              bts.map((p) => (
                <Link
                  key={p.id}
                  href={`/feed#post-${encodeURIComponent(p.id)}`}
                  className="sidebar-item"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.mediaUrl || "/seed/work-1.svg"} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">Show & tell</p>
                    <p className="meta-text line-clamp-1">{p.body}</p>
                  </div>
                  <span className="ml-auto text-slate-500">›</span>
                </Link>
              ))
            ) : (
              <div className="surface-soft p-4">
                <p className="text-sm font-semibold text-white">No BTS posts yet</p>
                <p className="meta-text mt-1">Create a post and toggle “Show & tell” to share your process.</p>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-card">
          <p className="text-sm font-semibold text-white">Trending creators</p>
          <div className="mt-4 space-y-3">
            {trending.length ? (
              trending.map((u) => (
                <CreatorCard
                  key={u.id}
                  viewerId={viewerId}
                  user={u}
                  initialFollowing={followingSet.has(u.id)}
                />
              ))
            ) : (
              <div className="surface-soft p-4">
                <p className="text-sm font-semibold text-white">No trending creators yet</p>
                <p className="meta-text mt-1">Post to the feed and you’ll start seeing creator highlights here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-card">
          <p className="text-sm font-semibold text-white">Featured opportunities</p>
          <div className="mt-3 space-y-3">
            {featuredOpportunities.map((o) => (
              <OpportunityCard key={o.id} title={o.title} meta={o.meta} href={`/opportunities/${o.id}`} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

