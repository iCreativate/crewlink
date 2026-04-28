"use client";

import Link from "next/link";

export function RightRail({ viewerId }: { viewerId: string }) {
  return (
    <aside className="right-rail order-3 lg:order-none lg:sticky lg:top-20 lg:self-start">
      <div className="space-y-6">
        <div className="sidebar-card p-5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Behind the scenes</p>
          <p className="meta-text mt-1">Your BTS and recent portfolio moments.</p>
          <div className="mt-4 grid gap-3">
            {["/seed/work-1.svg", "/seed/work-2.svg", "/seed/work-3.svg"].map((src) => (
              <Link
                key={src}
                href={`/profile/${viewerId}#portfolio`}
                className="group relative flex items-center gap-3 rounded-2xl bg-white/30 p-3 text-left transition hover:bg-white/45 dark:bg-zinc-950/25 dark:hover:bg-zinc-950/40"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-black/5 dark:bg-zinc-900/50 dark:ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">Your behind the scenes</p>
                  <p className="meta-text truncate">Open your portfolio</p>
                </div>
                <span className="ml-auto text-zinc-400 dark:text-zinc-500">›</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="sidebar-card p-5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Trending creators</p>
          <div className="mt-4 space-y-3">
            {[
              { name: "Kamo Sets", role: "1st AC", img: "/seed/avatar-m1.svg" },
              { name: "Thando Visuals", role: "Director / DP", img: "/seed/avatar-f3.svg" },
              { name: "EditLab", role: "Post house", img: "/seed/avatar-m2.svg" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-3">
                <Link href="/freelancers" className="flex min-w-0 items-center gap-3 rounded-2xl pr-2 hover:bg-white/20 dark:hover:bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{c.name}</p>
                    <p className="meta-text truncate">{c.role}</p>
                  </div>
                </Link>
                <button type="button" className="pill-button px-3 py-2 text-xs">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-card p-5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Featured opportunities</p>
          <div className="mt-3 space-y-3">
            {[
              { title: "Short doc — sound recordist", meta: "Cape Town • 2 days • Paid" },
              { title: "Commercial — gaffer + swing", meta: "Johannesburg • Friday • Paid" },
            ].map((o) => (
              <Link key={o.title} href="/jobs" className="surface-soft block p-4 transition hover:bg-white/50 dark:hover:bg-zinc-950/45">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{o.title}</p>
                <p className="meta-text mt-1">{o.meta}</p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition group-hover:bg-sky-500">
                    View
                  </span>
                  <span className="pill-button px-3 py-2 text-xs">Save</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

