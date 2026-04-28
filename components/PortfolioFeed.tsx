"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { LazyVideo } from "@/components/portfolio/LazyVideo";
import { ReelViewerModal, type ReelMedia } from "@/components/reels/ReelViewerModal";

type FeedUser = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  profile?: { headline: string | null; specializations: string[] };
};

function isSvg(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg");
}

export type PortfolioFeedItem = {
  id: string;
  title: string | null;
  description: string | null;
  gearTags: string[];
  mediaType: "IMAGE" | "VIDEO";
  url: string;
  createdAt: string;
  user: FeedUser;
  likesCount: number;
  savesCount: number;
  likedByViewer: boolean;
  savedByViewer: boolean;
};

type FeedPage = { items: PortfolioFeedItem[]; nextCursor: string | null };

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load portfolio feed");
    return r.json() as Promise<FeedPage>;
  });

function specializationLabel(user: FeedUser) {
  const list = user.profile?.specializations ?? [];
  if (list.length) return list[0]!;
  if (user.profile?.headline) return user.profile.headline;
  return "Freelancer";
}

function Avatar({ user }: { user: FeedUser }) {
  if (user.image) {
    return (
      <div className="relative h-9 w-9 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
        {isSvg(user.image) ? (
          <img src={user.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Image src={user.image} alt="" fill className="object-cover" sizes="36px" />
        )}
      </div>
    );
  }
  const initial = (user.name ?? "C")[0]?.toUpperCase() ?? "C";
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {initial}
    </div>
  );
}

function ActionButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100"
          : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
      ].join(" ")}
    >
      <span>{label}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{count.toLocaleString()}</span>
    </button>
  );
}

function FeedCard({
  item,
  onPatch,
  priority,
}: {
  item: PortfolioFeedItem;
  onPatch: (id: string, patch: Partial<PortfolioFeedItem>) => void;
  priority: boolean;
}) {
  const [busy, setBusy] = useState<"like" | "save" | null>(null);
  const [reel, setReel] = useState<ReelMedia | null>(null);

  const onToggleLike = useCallback(async () => {
    if (busy) return;
    setBusy("like");

    const optimisticLiked = !item.likedByViewer;
    onPatch(item.id, {
      likedByViewer: optimisticLiked,
      likesCount: item.likesCount + (optimisticLiked ? 1 : -1),
    });

    const res = await fetch(`/api/portfolio/${item.id}/like`, { method: optimisticLiked ? "POST" : "DELETE" });
    const json = (await res.json().catch(() => ({}))) as
      | { likedByViewer?: boolean; likesCount?: number; error?: string }
      | { error?: string };
    if (!res.ok) {
      // revert
      onPatch(item.id, { likedByViewer: item.likedByViewer, likesCount: item.likesCount });
    } else {
      onPatch(item.id, {
        likedByViewer: Boolean((json as { likedByViewer?: boolean }).likedByViewer),
        likesCount:
          typeof (json as { likesCount?: number }).likesCount === "number"
            ? (json as { likesCount: number }).likesCount
            : item.likesCount,
      });
    }
    setBusy(null);
  }, [busy, item.id, item.likedByViewer, item.likesCount, onPatch]);

  const onToggleSave = useCallback(async () => {
    if (busy) return;
    setBusy("save");

    const optimisticSaved = !item.savedByViewer;
    onPatch(item.id, {
      savedByViewer: optimisticSaved,
      savesCount: item.savesCount + (optimisticSaved ? 1 : -1),
    });

    const res = await fetch(`/api/portfolio/${item.id}/save`, { method: optimisticSaved ? "POST" : "DELETE" });
    const json = (await res.json().catch(() => ({}))) as
      | { savedByViewer?: boolean; savesCount?: number; error?: string }
      | { error?: string };
    if (!res.ok) {
      onPatch(item.id, { savedByViewer: item.savedByViewer, savesCount: item.savesCount });
    } else {
      onPatch(item.id, {
        savedByViewer: Boolean((json as { savedByViewer?: boolean }).savedByViewer),
        savesCount:
          typeof (json as { savesCount?: number }).savesCount === "number"
            ? (json as { savesCount: number }).savesCount
            : item.savesCount,
      });
    }
    setBusy(null);
  }, [busy, item.id, item.savedByViewer, item.savesCount, onPatch]);

  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={item.user} />
          <div className="min-w-0">
            <Link
              href={`/profile/${item.user.id}`}
              className="block truncate text-sm font-semibold text-zinc-900 hover:text-sky-700 dark:text-white dark:hover:text-sky-300"
            >
              {item.user.name ?? "Creator"}
            </Link>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{specializationLabel(item.user)}</p>
          </div>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="relative bg-zinc-100 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() =>
            setReel({
              url: item.url,
              mediaType: item.mediaType,
              title: item.title ?? "Reel",
              subtitle: item.user.name ?? "Creator",
            })
          }
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
          aria-label={item.title ? `Watch reel: ${item.title}` : "Watch reel"}
        >
          Watch
        </button>
        <div className="relative aspect-[4/5] w-full">
          {item.mediaType === "VIDEO" ? (
            <button type="button" className="block h-full w-full" onClick={() => setReel({ url: item.url, mediaType: "VIDEO", title: item.title ?? "Reel", subtitle: item.user.name ?? "Creator" })}>
              <LazyVideo src={item.url} className="h-full w-full object-cover" />
            </button>
          ) : (
            <button type="button" className="block h-full w-full" onClick={() => setReel({ url: item.url, mediaType: "IMAGE", title: item.title ?? "Reel", subtitle: item.user.name ?? "Creator" })}>
              <Image
                src={item.url}
                alt={item.title || item.description || "Portfolio media"}
                fill
                unoptimized
                priority={priority}
                className="object-cover transition hover:scale-[1.01]"
                sizes="(max-width: 640px) 100vw, 560px"
              />
            </button>
          )}
        </div>
      </div>

      <ReelViewerModal open={Boolean(reel)} onClose={() => setReel(null)} media={reel} />

      <div className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <ActionButton active={item.likedByViewer} label="Like" count={item.likesCount} onClick={onToggleLike} />
          <ActionButton active={item.savedByViewer} label="Save" count={item.savesCount} onClick={onToggleSave} />
        </div>

        {item.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{item.description}</p>
        ) : null}

        {item.gearTags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {item.gearTags.slice(0, 12).map((t) => (
              <span
                key={t}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PortfolioFeed() {
  const getKey = (pageIndex: number, previous: FeedPage | null) => {
    if (previous && !previous.nextCursor) return null;
    if (pageIndex === 0) return `/api/portfolio?take=8`;
    return `/api/portfolio?take=8&cursor=${encodeURIComponent(previous!.nextCursor!)}`;
  };

  const { data, error, isLoading, setSize, size, mutate } = useSWRInfinite<FeedPage>(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const items = useMemo(() => (data ? data.flatMap((p) => p.items) : []), [data]);
  const nextCursor = data?.[data.length - 1]?.nextCursor ?? null;
  const loadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  const [local, setLocal] = useState<Record<string, Partial<PortfolioFeedItem>>>({});
  const mergedItems = useMemo(
    () => items.map((it) => ({ ...it, ...(local[it.id] ?? {}) })),
    [items, local],
  );

  const patch = useCallback((id: string, patch: Partial<PortfolioFeedItem>) => {
    setLocal((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  }, []);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!nextCursor) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting) setSize((s) => s + 1);
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nextCursor, setSize]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[560px] space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="h-12 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
            <div className="aspect-[4/5] animate-pulse bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-20 animate-pulse bg-zinc-50 dark:bg-zinc-950" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">Could not load portfolio feed.</p>;
  }

  if (!mergedItems.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        No portfolio posts yet. Sign in and add work from Portfolio → Manage.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] space-y-5">
      {mergedItems.map((item, idx) => (
        <FeedCard key={item.id} item={item} onPatch={patch} priority={idx < 2} />
      ))}
      <div ref={sentinelRef} />
      {loadingMore ? (
        <p className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : nextCursor ? (
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={() => setSize(size + 1)}
            className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Load more
          </button>
        </div>
      ) : (
        <p className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">You’re all caught up.</p>
      )}
      <button type="button" className="hidden" onClick={() => mutate()} aria-hidden="true" />
    </div>
  );
}

