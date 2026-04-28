"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { FeedCard } from "@/components/feed/FeedCard";
import type { FeedPost } from "@/components/feed/FeedPostCard";

type FeedPage = { items: FeedPost[]; nextCursor: string | null };

const fetcher = (url: string) =>
  fetch(url).then((r) => {
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
                <div className="crewlink-shimmer h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <div className="crewlink-shimmer h-3 w-36 rounded" />
                  <div className="crewlink-shimmer h-2.5 w-24 rounded" />
                </div>
              </div>
              <div className="crewlink-shimmer h-7 w-16 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="crewlink-shimmer h-2.5 w-full rounded" />
              <div className="crewlink-shimmer h-2.5 w-11/12 rounded" />
              <div className="crewlink-shimmer h-2.5 w-8/12 rounded" />
            </div>
            <div className="crewlink-shimmer mt-4 aspect-video w-full rounded-2xl" />
            <div className="mt-4 flex gap-2">
              <div className="crewlink-shimmer h-9 w-24 rounded-full" />
              <div className="crewlink-shimmer h-9 w-28 rounded-full" />
              <div className="crewlink-shimmer h-9 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">Could not load feed.</p>;
  }

  if (!mergedItems.length) {
    const demo: FeedPost[] = [
      {
        id: "demo-1",
        body:
          "Wrapped a night exterior in Salt River. New favorite combo: 1/8 grid + sodium practicals. Anyone got a go-to kit list for fast run-and-gun commercials?",
        mediaType: "IMAGE",
        mediaUrl: "/seed/work-1.svg",
        collab: false,
        collabNote: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        author: {
          id: "demo-user-1",
          name: "Lebo M.",
          image: "/seed/avatar-f1.svg",
          role: "FREELANCER",
          profile: { headline: "Cinematographer", specializations: ["Camera"] },
        },
        likedByViewer: false,
        likesCount: 24,
        commentsCount: 6,
        sharesCount: 3,
        commentsPreview: [
          {
            id: "demo-1-c1",
            authorName: "Theo N.",
            authorRole: "Gaffer",
            body: "Love this. If you’re moving fast, I keep it simple: neg fill, 1 diffusion choice, and a practical dimmer pack.",
          },
          {
            id: "demo-1-c2",
            authorName: "Mila K.",
            authorRole: "Producer",
            body: "Also: post your call sheet template sometime — always curious how teams structure these quick commercials.",
          },
        ],
        sharedPost: null,
      },
      {
        id: "demo-2",
        body:
          "Looking for an editor who can turn around a 30s cut by Friday. Cape Town-based preferred. Paid, credit guaranteed. DM me your reel + rate.",
        mediaType: null,
        mediaUrl: null,
        collab: true,
        collabNote: "Editor needed (Premiere/Resolve). Remote ok if you can sync daily.",
        createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        author: {
          id: "demo-user-2",
          name: "Studio Kora",
          image: "/seed/avatar-m2.svg",
          role: "MEDIA_HOUSE",
          profile: { headline: "Production studio", specializations: ["Commercial"] },
        },
        likedByViewer: false,
        likesCount: 51,
        commentsCount: 14,
        sharesCount: 8,
        commentsPreview: [
          {
            id: "demo-2-c1",
            authorName: "Asha D.",
            authorRole: "Editor",
            body: "I can do the Friday turnaround. Sending reel + rate now — do you need subtitles or just clean mix?",
          },
          {
            id: "demo-2-c2",
            authorName: "Sizwe P.",
            authorRole: "Colorist",
            body: "If you need a quick grade pass too, happy to jump in. Resolve workflow is easiest for me.",
          },
        ],
        sharedPost: null,
      },
      {
        id: "demo-3",
        body:
          "Repost: This BTS sound workflow is clean. If you’re on set this weekend and want to shadow, drop a comment — we’re making space for newcomers.",
        mediaType: null,
        mediaUrl: null,
        collab: false,
        collabNote: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        author: {
          id: "demo-user-3",
          name: "Nia S.",
          image: "/seed/avatar-f2.svg",
          role: "FREELANCER",
          profile: { headline: "Sound recordist", specializations: ["Sound"] },
        },
        likedByViewer: false,
        likesCount: 92,
        commentsCount: 22,
        sharesCount: 15,
        commentsPreview: [
          {
            id: "demo-3-c1",
            authorName: "Kayla R.",
            authorRole: "Runner",
            body: "This is exactly what I’m trying to learn. I’m free Saturday if there’s space to shadow.",
          },
          {
            id: "demo-3-c2",
            authorName: "Jabu M.",
            authorRole: "Sound",
            body: "Huge. The room tone reminder should be printed on set walls.",
          },
        ],
        sharedPost: {
          id: "demo-3a",
          body: "My 3-step BTS audio checklist for loud locations: mic placement, room tone, backup track. Saved me more than once.",
          mediaType: "VIDEO",
          mediaUrl: "/seed/work-2.svg",
          collab: false,
          collabNote: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
          author: {
            id: "demo-user-4",
            name: "Asha D.",
            image: "/seed/avatar-f3.svg",
            role: "FREELANCER",
            profile: { headline: "BTS + Editor", specializations: ["Edit"] },
          },
          likedByViewer: false,
          likesCount: 210,
          commentsCount: 48,
          sharesCount: 34,
          commentsPreview: [
            {
              id: "demo-3a-c1",
              authorName: "Nia S.",
              authorRole: "Sound recordist",
              body: "This saved my last doc shoot. Backup track is non‑negotiable now.",
            },
          ],
          sharedPost: null,
        },
      },
    ];

    return (
      <div className="space-y-5">
        <div className="rounded-[28px] bg-gradient-to-b from-white/70 to-white/55 p-6 ring-1 ring-white/6 dark:from-zinc-950/65 dark:to-zinc-950/45 dark:ring-white/7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
            Kickstart the community
          </p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Your feed is new — here’s what great posts look like</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Share a recent shoot, ask for collaborators, or repost work that inspired you. These are demo posts to make the space feel alive.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Post a BTS moment", "Ask for a collaborator", "Share a reel link", "Shout out a crew member"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-black/5 dark:bg-zinc-950/35 dark:text-zinc-200 dark:ring-white/10"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        {demo.map((post) => (
          <FeedCard key={post.id} post={post} onPatch={() => {}} />
        ))}
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
      <button type="button" className="hidden" onClick={() => mutate()} aria-hidden="true" />
    </div>
  );
}

