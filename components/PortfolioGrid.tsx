"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import { ReelViewerModal, type ReelMedia } from "@/components/reels/ReelViewerModal";

export type PortfolioItem = {
  id: string;
  title: string | null;
  description: string | null;
  mediaType: "IMAGE" | "VIDEO";
  url: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null; role: string };
};

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Failed to load portfolio");
  return r.json();
});

function MediaTile({ item }: { item: PortfolioItem }) {
  const isVideo = item.mediaType === "VIDEO";
  const [reel, setReel] = useState<ReelMedia | null>(null);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-[4/3] w-full">
        <button
          type="button"
          onClick={() => setReel({ url: item.url, mediaType: item.mediaType, title: item.title ?? "Reel", subtitle: item.user.name ?? "Creator" })}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
        >
          Watch
        </button>
        {isVideo ? (
          <button type="button" className="block h-full w-full" onClick={() => setReel({ url: item.url, mediaType: "VIDEO", title: item.title ?? "Reel", subtitle: item.user.name ?? "Creator" })}>
            <video src={item.url} className="h-full w-full object-cover" controls muted playsInline />
          </button>
        ) : (
          <button type="button" className="block h-full w-full" onClick={() => setReel({ url: item.url, mediaType: "IMAGE", title: item.title ?? "Reel", subtitle: item.user.name ?? "Creator" })}>
            <Image
              src={item.url}
              alt={item.title || "Portfolio"}
              fill
              unoptimized
              className="object-cover transition group-hover:scale-[1.02]"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          </button>
        )}
      </div>
      <ReelViewerModal open={Boolean(reel)} onClose={() => setReel(null)} media={reel} />
      <div className="space-y-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/profile/${item.user.id}`} className="text-sm font-medium text-zinc-900 hover:text-sky-700 dark:text-white dark:hover:text-sky-300">
            {item.user.name ?? "Creator"}
          </Link>
          <span className="text-xs text-zinc-500">{isVideo ? "Video" : "Image"}</span>
        </div>
        {item.title ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.title}</p> : null}
      </div>
    </div>
  );
}

export function PortfolioGrid() {
  const { data, error, isLoading } = useSWR<PortfolioItem[]>("/api/portfolio", fetcher, {
    refreshInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">Could not load portfolio items.</p>;
  }

  if (!data?.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        No portfolio pieces yet. Sign in and add work from Portfolio → Manage.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => (
        <MediaTile key={item.id} item={item} />
      ))}
    </div>
  );
}
