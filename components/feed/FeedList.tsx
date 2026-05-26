"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { FeedCard } from "@/components/feed/FeedCard";
import type { FeedPost } from "@/components/feed/FeedPostCard";

type FeedPage = { items: FeedPost[]; nextCursor: string | null };

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => {
    if (r.status === 401) throw new Error("Sign in to view your feed.");
    if (!r.ok) throw new Error("Failed to load feed");
    return r.json() as Promise<FeedPage>;
  });

export function FeedList() {
  const params = useSearchParams();
  const tab = (params.get("tab") ?? "for-you").toLowerCase();

  const getKey = (pageIndex: number, previous: FeedPage | null) => {
    if (previous && !previous.nextCursor) return null;
    const base = `/api/feed?take=10&tab=${encodeURIComponent(tab)}`;
    if (pageIndex === 0) return base;
    return `${base}&cursor=${encodeURIComponent(previous!.nextCursor!)}`;
  };

  const { data, error, isLoading, setSize, size, mutate } = useSWRInfinite<FeedPage>(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const items = useMemo(() => (data ? data.flatMap((p) => p.items) : []), [data]);
  const nextCursor = data?.[data.length - 1]?.nextCursor ?? null;
  const loadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  const [local, setLocal] = useState<Record<string, Partial<FeedPost>>>({});
  const mergedItems = useMemo(() => items.map((it) => ({ ...it, ...(local[it.id] ?? {}) })), [items, local]);

  const patch = useCallback((id: string, patch: Partial<FeedPost>) => {
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
        if (e?.isIntersecting) setSize((s) => s + 1);
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nextCursor, setSize]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[28px] bg-white/65 p-5 shadow-[0_24px_80px_-70px_rgba(0,0,0,0.9)] ring-1 ring-white/5 dark:bg-zinc-950/55 dark:ring-white/6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="gr8crew-shimmer h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <div className="gr8crew-shimmer h-3 w-36 rounded" />
                  <div className="gr8crew-shimmer h-2.5 w-24 rounded" />
                </div>
              </div>
              <div className="gr8crew-shimmer h-7 w-16 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="gr8crew-shimmer h-2.5 w-full rounded" />
              <div className="gr8crew-shimmer h-2.5 w-11/12 rounded" />
              <div className="gr8crew-shimmer h-2.5 w-8/12 rounded" />
            </div>
            <div className="gr8crew-shimmer mt-4 aspect-video w-full rounded-2xl" />
            <div className="mt-4 flex gap-2">
              <div className="gr8crew-shimmer h-9 w-24 rounded-full" />
              <div className="gr8crew-shimmer h-9 w-28 rounded-full" />
              <div className="gr8crew-shimmer h-9 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : "Could not load feed.";
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm dark:border-red-900/60 dark:bg-red-950/30">
        <p className="font-medium text-red-900 dark:text-red-100">{message}</p>
        <button
          type="button"
          onClick={() => void mutate()}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!mergedItems.length) {
    return (
      <div className="rounded-[28px] bg-gradient-to-b from-white/70 to-white/55 p-8 text-center ring-1 ring-white/6 dark:from-zinc-950/65 dark:to-zinc-950/45 dark:ring-white/7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
          Your feed is empty
        </p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Start the conversation</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Share a behind-the-scenes moment, ask for collaborators, or browse open jobs to find your next gig.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#feed-composer"
            className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Write a post
          </a>
          <Link
            href="/jobs"
            className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Browse jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {mergedItems.map((post) => (
        <FeedCard key={post.id} post={post} onPatch={patch} />
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
    </div>
  );
}
