import { BoostAccountButton } from "@/components/BoostAccountButton";

export function ProfileSidebar({
  user,
  stats,
}: {
  user: { id: string; name: string; headline: string; image: string | null; location: string };
  stats: { posts: string; collabs: string; location: string };
}) {
  return (
    <aside className="left-sidebar">
      <div className="sidebar-card">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Community</p>
        <div className="mt-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.image ?? "/seed/avatar-m1.svg"} alt="" className="avatar h-11 w-11" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="meta-text truncate">{user.headline}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Posts", value: stats.posts },
            { label: "Collabs", value: stats.collabs },
            { label: "Location", value: stats.location },
          ].map((s) => (
            <div key={s.label} className="surface-soft px-3 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          {[
            { href: `/profile/${user.id}`, label: "View profile" },
            { href: "/portfolio/manage", label: "My posts & portfolio" },
            { href: "/portfolio", label: "Saved work" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="sidebar-item">
              {l.label}
              <span className="text-slate-500">›</span>
            </a>
          ))}
        </div>

        <div className="mt-5 surface-soft p-4">
          <p className="meta-text">
            Tip: Posts that do well usually include a frame grab, what you learned, and who you want to meet next.
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-b from-amber-500/15 to-amber-500/5 p-4 ring-1 ring-amber-500/15">
          <p className="text-sm font-semibold text-white">Boost your account</p>
          <p className="meta-text mt-1">Get noticed more in discovery and highlights for a limited time.</p>
          <div className="mt-3">
            <BoostAccountButton />
          </div>
        </div>
      </div>
    </aside>
  );
}

