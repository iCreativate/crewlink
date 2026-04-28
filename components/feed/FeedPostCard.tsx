"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LazyVideo } from "@/components/portfolio/LazyVideo";
import { BoostPostButton } from "@/components/feed/BoostPostButton";
import { MediaCarousel, type MediaItem } from "@/components/feed/MediaCarousel";

function isSvg(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg");
}

const urlRegex = /\bhttps?:\/\/[^\s<>"')\]]+/gi;

function isDirectVideoUrl(url: string) {
  const base = url.split("?")[0]?.toLowerCase() ?? "";
  return base.endsWith(".mp4") || base.endsWith(".webm") || base.endsWith(".mov");
}

function renderTextWithLinks(text: string) {
  const matches = Array.from(text.matchAll(urlRegex));
  if (!matches.length) return text;

  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of matches) {
    const url = m[0];
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    out.push(
      <a
        key={`${idx}-${url}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="break-all font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
      >
        {url}
      </a>,
    );
    last = idx + url.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function firstUrl(text: string) {
  const m = text.match(urlRegex);
  return m?.[0] ?? null;
}

type FeedUser = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  profile?: { headline: string | null; specializations: string[] };
};

type FeedCommentPreview = {
  id: string;
  authorName: string;
  authorRole?: string;
  body: string;
};

type FeedComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; role: string; image: string | null };
};

export type FeedPost = {
  id: string;
  body: string;
  mediaType: "IMAGE" | "VIDEO" | null;
  mediaUrl: string | null;
  mediaItems?: MediaItem[];
  viewerReaction?: "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY" | null;
  reactionCounts?: Record<string, number>;
  kind?: "POST" | "AD";
  adType?: "SPONSORED_POST" | "OPPORTUNITY" | "FEATURED_CREATOR" | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  bts?: boolean;
  collab: boolean;
  collabNote: string | null;
  location?: string | null;
  collaborators?: string[];
  boostedActive?: boolean;
  boostedUntil?: string | null;
  createdAt: string;
  author: FeedUser;
  likedByViewer: boolean;
  likesCount: number;
  commentsCount?: number;
  sharesCount: number;
  sharedPost: FeedPost | null;
  commentsPreview?: FeedCommentPreview[];
};

function specializationLabel(user: FeedUser) {
  const list = user.profile?.specializations ?? [];
  if (list.length) return list[0]!;
  if (user.profile?.headline) return user.profile.headline;
  return user.role === "MEDIA_HOUSE" ? "Media house" : "Freelancer";
}

function Avatar({ user }: { user: FeedUser }) {
  if (user.image) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800">
        {isSvg(user.image) ? (
          // next/image commonly blocks SVG; use <img> for local SVG avatars.
          <img src={user.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Image src={user.image} alt="" fill className="object-cover" sizes="40px" />
        )}
      </div>
    );
  }
  const initial = (user.name ?? "C")[0]?.toUpperCase() ?? "C";
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {initial}
    </div>
  );
}

function ActionButton({
  active,
  label,
  count,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-pressed={active}
      className={[
        "group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 active:scale-[0.99]",
        active
          ? "bg-sky-600/10 text-sky-700 ring-1 ring-sky-500/20 hover:bg-sky-600/15 focus-visible:ring-sky-500/35 dark:bg-sky-400/10 dark:text-sky-200"
          : "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200/70 hover:bg-zinc-200/70 focus-visible:ring-sky-500/35 dark:bg-zinc-900/60 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-900",
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-2">
        <span
          className={[
            "text-zinc-500 transition group-hover:text-zinc-700 dark:text-zinc-300 dark:group-hover:text-zinc-100",
            active ? "text-sky-700 dark:text-sky-200" : "",
          ].join(" ")}
        >
          {icon}
        </span>
        <span>{label}</span>
      </span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{count.toLocaleString()}</span>
    </button>
  );
}

function Media({
  post,
  onOpenImage,
}: {
  post: FeedPost;
  onOpenImage: () => void;
}) {
  if (!post.mediaType || !post.mediaUrl) return null;

  // Images expand in-app; videos remain playable inline.
  if (post.mediaType === "VIDEO") {
    return (
      <div className="post-image bg-zinc-100 dark:bg-zinc-900/50">
        <div className="relative aspect-video w-full">
          <LazyVideo src={post.mediaUrl} className="h-full w-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenImage}
      className="post-image block w-full bg-zinc-100 transition hover:brightness-[1.03] dark:bg-zinc-900/50"
      aria-label="Open image"
    >
      <div className="relative aspect-video w-full">
        {isSvg(post.mediaUrl) ? (
          <img src={post.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Image src={post.mediaUrl} alt="" fill className="object-cover" sizes="(max-width: 720px) 100vw, 720px" />
        )}
      </div>
    </button>
  );
}

export function FeedPostCard({
  post,
  onPatch,
}: {
  post: FeedPost;
  onPatch: (id: string, patch: Partial<FeedPost>) => void;
}) {
  const [busy, setBusy] = useState<"like" | "share" | null>(null);
  const [likeBump, setLikeBump] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const holdRef = useState<{ t: number | null }>({ t: null })[0];
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [thread, setThread] = useState<FeedComment[] | null>(null);
  const [threadBusy, setThreadBusy] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);

  const onOpenPost = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("a,button,input,textarea,label,select,[role='dialog']")) return;
      const hash = `post-${post.id}`;
      try {
        window.history.replaceState(null, "", `/feed#${encodeURIComponent(hash)}`);
      } catch {
        // ignore
      }
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [post.id],
  );

  useEffect(() => {
    if (!commentOpen) return;
    if (threadBusy) return;
    if (thread !== null) return;

    let cancelled = false;
    setThreadBusy(true);
    setThreadError(null);

    fetch(`/api/feed/${post.id}/comments`)
      .then(async (r) => {
        const json = (await r.json().catch(() => null)) as null | { items?: FeedComment[] };
        if (!r.ok) throw new Error("Failed to load comments");
        return Array.isArray(json?.items) ? json!.items! : [];
      })
      .then((items) => {
        if (cancelled) return;
        setThread(items);
      })
      .catch(() => {
        if (cancelled) return;
        setThreadError("Could not load comments.");
        setThread([]);
      })
      .finally(() => {
        if (cancelled) return;
        setThreadBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [commentOpen, post.id, thread, threadBusy]);

  const createdLabel = useMemo(() => {
    const d = new Date(post.createdAt);
    const now = Date.now();
    const delta = Math.max(0, now - d.getTime());
    const mins = Math.floor(delta / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  }, [post.createdAt]);

  const onToggleLike = useCallback(async () => {
    if (busy) return;
    setBusy("like");
    const currently = post.viewerReaction ?? null;
    const next = currently ? null : "LIKE";

    // optimistic
    const counts = { ...(post.reactionCounts ?? {}) };
    if (currently) counts[currently] = Math.max(0, (counts[currently] ?? 0) - 1);
    if (next) counts[next] = (counts[next] ?? 0) + 1;
    onPatch(post.id, { viewerReaction: next, reactionCounts: counts });

    if (next) {
      setLikeBump(true);
      window.setTimeout(() => setLikeBump(false), 220);
    }

    const res = await fetch(`/api/feed/${post.id}/reaction`, {
      method: next ? "POST" : "DELETE",
      headers: next ? { "Content-Type": "application/json" } : undefined,
      body: next ? JSON.stringify({ type: next }) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as { viewerReaction?: string | null; reactionCounts?: Record<string, number> };
    if (!res.ok) {
      onPatch(post.id, { viewerReaction: currently, reactionCounts: post.reactionCounts ?? {} });
    } else {
      onPatch(post.id, {
        viewerReaction: (json.viewerReaction as any) ?? null,
        reactionCounts: json.reactionCounts ?? {},
      });
    }
    setBusy(null);
  }, [busy, onPatch, post.id, post.reactionCounts, post.viewerReaction]);

  const setReaction = useCallback(
    async (type: "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY") => {
      if (busy) return;
      setBusy("like");
      setReactionOpen(false);
      const prev = post.viewerReaction ?? null;
      const counts = { ...(post.reactionCounts ?? {}) };
      if (prev) counts[prev] = Math.max(0, (counts[prev] ?? 0) - 1);
      counts[type] = (counts[type] ?? 0) + 1;
      onPatch(post.id, { viewerReaction: type, reactionCounts: counts });

      const res = await fetch(`/api/feed/${post.id}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = (await res.json().catch(() => ({}))) as { viewerReaction?: string | null; reactionCounts?: Record<string, number> };
      if (!res.ok) {
        onPatch(post.id, { viewerReaction: prev, reactionCounts: post.reactionCounts ?? {} });
      } else {
        onPatch(post.id, {
          viewerReaction: (json.viewerReaction as any) ?? null,
          reactionCounts: json.reactionCounts ?? {},
        });
      }
      setBusy(null);
    },
    [busy, onPatch, post.id, post.reactionCounts, post.viewerReaction],
  );

  const reactionTotal = useMemo(() => {
    const m = post.reactionCounts ?? {};
    return Object.values(m).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  }, [post.reactionCounts]);

  const reactionLabel = useMemo(() => {
    const t = post.viewerReaction ?? null;
    if (t === "LOVE") return "Love";
    if (t === "HAHA") return "Haha";
    if (t === "WOW") return "Wow";
    if (t === "SAD") return "Sad";
    if (t === "ANGRY") return "Angry";
    if (t === "LIKE") return "Like";
    return "Like";
  }, [post.viewerReaction]);

  const postPermalink = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return `${origin}/feed#post-${encodeURIComponent(post.id)}`;
  }, [post.id]);

  const onRepostToFeed = useCallback(async () => {
    if (busy) return;
    setBusy("share");
    const res = await fetch(`/api/feed/${post.id}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setBusy(null);
    if (res.ok) {
      onPatch(post.id, { sharesCount: post.sharesCount + 1 });
      setShareOpen(false);
      setShareToast("Reposted to feed.");
      window.setTimeout(() => setShareToast(null), 1600);
    }
  }, [busy, onPatch, post.id, post.sharesCount]);

  const onCopyLink = useCallback(async () => {
    if (!postPermalink) return;
    try {
      await navigator.clipboard.writeText(postPermalink);
      setShareToast("Link copied.");
    } catch {
      setShareToast("Could not copy link.");
    } finally {
      window.setTimeout(() => setShareToast(null), 1600);
    }
  }, [postPermalink]);

  const onNativeShare = useCallback(async () => {
    if (!postPermalink) return;
    if (!("share" in navigator)) {
      await onCopyLink();
      return;
    }
    try {
      await (navigator as Navigator & { share?: (data: { url?: string }) => Promise<void> }).share?.({ url: postPermalink });
      setShareOpen(false);
    } catch {
      // user cancelled or share failed; no toast
    }
  }, [onCopyLink, postPermalink]);

  const onSubmitComment = useCallback(async () => {
    const trimmed = commentBody.trim();
    if (!trimmed || commentBusy) return;
    setCommentBusy(true);
    try {
      const res = await fetch(`/api/feed/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const json = (await res.json().catch(() => null)) as
        | null
        | {
            id: string;
            body: string;
            createdAt?: string;
            author?: { id?: string; name: string | null; role: string; image?: string | null };
          };

      if (res.ok && json?.id) {
        const createdAt = typeof json.createdAt === "string" ? json.createdAt : new Date().toISOString();
        const nextPreview = [
          {
            id: json.id,
            authorName: json.author?.name ?? "You",
            authorRole: json.author?.role,
            body: json.body,
          },
          ...((post.commentsPreview ?? []) as FeedCommentPreview[]),
        ].slice(0, 2);

        setThread((prev) => {
          const next: FeedComment = {
            id: json.id,
            body: json.body,
            createdAt,
            author: {
              id: json.author?.id ?? "me",
              name: json.author?.name ?? "You",
              role: json.author?.role ?? "FREELANCER",
              image: json.author?.image ?? null,
            },
          };
          if (prev === null) return [next];
          return [next, ...prev];
        });

        onPatch(post.id, {
          commentsCount: (post.commentsCount ?? 0) + 1,
          commentsPreview: nextPreview,
        });
        setCommentBody("");
        setCommentOpen(true);
      }
    } finally {
      setCommentBusy(false);
    }
  }, [commentBody, commentBusy, onPatch, post.commentsCount, post.commentsPreview, post.id]);

  const totalEngagement = useMemo(() => {
    const comments = post.commentsCount ?? 0;
    return post.likesCount + comments + post.sharesCount;
  }, [post.commentsCount, post.likesCount, post.sharesCount]);

  const commentPreview = useMemo(() => {
    const fromData = Array.isArray(post.commentsPreview) ? post.commentsPreview : [];
    if (fromData.length) return fromData.slice(0, 2);
    return [];
  }, [post.commentsPreview]);

  const ad = post.kind === "AD" && post.adType ? post.adType : null;
  const bodyText = useMemo(() => {
    const raw = (post.body ?? "").toString();
    // Some historical posts ended up with stray standalone "0" lines; strip them for display.
    const lines = raw.split("\n").filter((l) => {
      const cleaned = l
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
        .trim();
      return cleaned !== "0";
    });
    return lines.join("\n").trimEnd();
  }, [post.body]);

  return (
    <article
      id={`post-${post.id}`}
      className="feed-card cursor-pointer"
      onClick={onOpenPost}
    >
      <div className="px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
        {ad ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Sponsored</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {ad === "OPPORTUNITY" ? "Opportunity" : ad === "FEATURED_CREATOR" ? "Featured creator" : "Sponsored post"}
              </p>
            </div>
            {post.ctaHref ? (
              <a
                href={post.ctaHref}
                className="primary-button"
                onClick={(e) => e.stopPropagation()}
                target={post.ctaHref.startsWith("http") ? "_blank" : undefined}
                rel={post.ctaHref.startsWith("http") ? "noreferrer" : undefined}
              >
                {post.ctaLabel?.trim() || "Learn more"}
              </a>
            ) : null}
          </div>
        ) : null}

        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar user={post.author} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Link
                  href={`/profile/${post.author.id}`}
                  className="truncate text-sm font-semibold text-zinc-900 hover:text-sky-700 dark:text-white dark:hover:text-sky-300"
                >
                  {post.author.name ?? "User"}
                </Link>
                {post.boostedActive ? (
                  <span className="rounded-full bg-amber-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-500/25 dark:bg-amber-400/10 dark:text-amber-200">
                    Boosted
                  </span>
                ) : null}
                {post.bts ? (
                  <span className="rounded-full bg-indigo-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-200">
                    Show & tell
                  </span>
                ) : null}
                <span className="hidden text-xs text-zinc-400 dark:text-zinc-500 sm:inline">•</span>
                <span className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {specializationLabel(post.author)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="meta-text">{createdLabel}</span>
                {totalEngagement ? (
                  <span className="meta-text text-zinc-400 dark:text-zinc-500">· {totalEngagement.toLocaleString()} engaged</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <BoostPostButton postId={post.id} />
          </div>
        </header>

        {post.collab ? (
          <div className="mt-4 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 px-4 py-3 text-sm text-emerald-950 ring-1 ring-emerald-500/15 dark:from-emerald-400/10 dark:to-emerald-400/5 dark:text-emerald-50">
            <p className="font-semibold">Open to collaborate</p>
            {post.collabNote ? <p className="mt-1 text-emerald-800 dark:text-emerald-200">{post.collabNote}</p> : null}
          </div>
        ) : null}

        {post.sharedPost ? (
          <div className="repost-block">
            <p className="meta-text text-[11px] font-semibold uppercase tracking-wider">Reposted</p>
            <div className="mt-3">
              <FeedPostCard post={post.sharedPost} onPatch={() => {}} />
            </div>
          </div>
        ) : null}

        {bodyText ? (
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.65] text-zinc-800 dark:text-zinc-200">
            {bodyText}
          </p>
        ) : null}

        {(Boolean(post.location) || (post.collaborators?.length ?? 0) > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {post.location ? (
              <span className="pill-button px-3 py-1.5 text-xs">
                <span className="text-zinc-500 dark:text-zinc-300">📍</span> {post.location}
              </span>
            ) : null}
            {(post.collaborators ?? []).slice(0, 6).map((c) => (
              <span key={c} className="pill-button px-3 py-1.5 text-xs">
                {c}
              </span>
            ))}
          </div>
        )}

        {(post.mediaItems?.length ?? 0) > 1 ? (
          <MediaCarousel items={post.mediaItems ?? []} expanded={imageExpanded} onToggleExpandImage={() => setImageExpanded((v) => !v)} />
        ) : post.mediaType || post.mediaUrl ? (
          <Media post={post} onOpenImage={() => setImageExpanded((v) => !v)} />
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div
            className="relative"
            onPointerDown={() => {
              if (holdRef.t) window.clearTimeout(holdRef.t);
              holdRef.t = window.setTimeout(() => setReactionOpen(true), 420) as unknown as number;
            }}
            onPointerUp={() => {
              if (holdRef.t) window.clearTimeout(holdRef.t);
              holdRef.t = null;
            }}
            onPointerLeave={() => {
              if (holdRef.t) window.clearTimeout(holdRef.t);
              holdRef.t = null;
            }}
          >
            <ActionButton
              active={Boolean(post.viewerReaction)}
              label={reactionLabel}
              count={reactionTotal}
              onClick={onToggleLike}
              icon={
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                className={["transition-transform duration-200", likeBump ? "scale-110" : ""].join(" ")}
              >
                <path
                  d="M12.1 21.35l-1.1-1.02C5.14 15.24 2 12.39 2 8.98 2 6.24 4.24 4 6.98 4c1.54 0 3.02.72 3.97 1.84C11.9 4.72 13.38 4 14.92 4 17.66 4 19.9 6.24 19.9 8.98c0 3.41-3.14 6.26-8.9 11.35z"
                  fill={post.viewerReaction ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
              }
            />

            {reactionOpen ? (
              <div
                className="absolute left-0 top-[-56px] z-40 flex items-center gap-1 rounded-full bg-zinc-950/90 px-2 py-2 ring-1 ring-white/10 backdrop-blur"
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  { t: "LIKE", l: "👍" },
                  { t: "LOVE", l: "❤️" },
                  { t: "HAHA", l: "😂" },
                  { t: "WOW", l: "😮" },
                  { t: "SAD", l: "😢" },
                  { t: "ANGRY", l: "😡" },
                ].map((r) => (
                  <button
                    key={r.t}
                    type="button"
                    onClick={() => void setReaction(r.t as any)}
                    className="h-9 w-9 rounded-full bg-white/5 text-base transition hover:bg-white/10"
                    aria-label={r.t}
                  >
                    {r.l}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setReactionOpen(false)}
                  className="ml-1 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
          <ActionButton
            active={false}
            label="Comment"
            count={post.commentsCount ?? 0}
            onClick={() => setCommentOpen((v) => !v)}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <ActionButton
            active={false}
            label="Share"
            count={post.sharesCount}
            onClick={() => setShareOpen(true)}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M7 7h11v4l4-4-4-4v3H6a4 4 0 0 0-4 4v3h2V10a3 3 0 0 1 3-3z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 17H6v-4l-4 4 4 4v-3h12a4 4 0 0 0 4-4v-3h-2v3a3 3 0 0 1-3 3z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        </div>

        {shareOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            onClick={() => setShareOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Share</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Choose who/how you want to share this post.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={onNativeShare}
                  className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  Share via…
                </button>
                <button
                  type="button"
                  onClick={onCopyLink}
                  className="w-full rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 transition hover:bg-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800 dark:hover:bg-zinc-800"
                >
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={onRepostToFeed}
                  disabled={busy === "share"}
                  className="w-full rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 transition hover:bg-zinc-200/70 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800 dark:hover:bg-zinc-800"
                >
                  {busy === "share" ? "Reposting…" : "Repost to feed"}
                </button>
              </div>
            </div>
          </div>
        )}

        {shareToast ? (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
            {shareToast}
          </div>
        ) : null}

        {(commentPreview.length > 0 || commentOpen) && (
          <div className="mt-5 rounded-2xl bg-zinc-50/70 p-3 dark:bg-zinc-900/25">
            <p className="text-xs font-semibold text-zinc-900 dark:text-white">Comments</p>
            {commentOpen && (
              <div className="mt-3 flex items-end gap-2">
                <label className="sr-only" htmlFor={`comment-${post.id}`}>
                  Add a comment
                </label>
                <textarea
                  id={`comment-${post.id}`}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={2}
                  placeholder="Write a comment…"
                  className="min-h-[44px] w-full resize-none rounded-2xl bg-white/80 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-sky-500/30 dark:bg-zinc-950/40 dark:text-zinc-100"
                />
                <button
                  type="button"
                  disabled={commentBusy || !commentBody.trim()}
                  onClick={onSubmitComment}
                  className="inline-flex h-[44px] shrink-0 items-center justify-center rounded-full bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  {commentBusy ? "Posting…" : "Post"}
                </button>
              </div>
            )}
            {commentOpen ? (
              <div className="mt-3">
                {threadBusy ? (
                  <p className="text-[13px] text-zinc-600 dark:text-zinc-300">Loading comments…</p>
                ) : threadError ? (
                  <p className="text-[13px] text-red-600 dark:text-red-400">{threadError}</p>
                ) : thread && thread.length ? (
                  <div className="space-y-3">
                    {thread.map((c) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <div className="pt-0.5">
                          <Avatar user={c.author} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                              {c.author.name ?? "User"}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{c.author.role}</span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {renderTextWithLinks(c.body)}
                          </p>
                          {(() => {
                            const url = firstUrl(c.body);
                            if (!url || !isDirectVideoUrl(url)) return null;
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 block overflow-hidden rounded-2xl bg-white/5 p-3 transition hover:bg-white/10"
                              >
                                <p className="text-xs font-semibold text-white">Video link</p>
                                <p className="meta-text mt-1 break-all">{url}</p>
                              </a>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                    No comments yet. Be the first to comment.
                  </p>
                )}
              </div>
            ) : commentPreview.length ? (
              <div className="mt-2 space-y-2">
                {commentPreview.map((c) => (
                  <div key={c.id} className="text-sm">
                    <span className="font-semibold text-zinc-900 dark:text-white">{c.authorName}</span>{" "}
                    {c.authorRole ? <span className="text-xs text-zinc-500 dark:text-zinc-400">· {c.authorRole}</span> : null}
                    <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">{renderTextWithLinks(c.body)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                Be the first to comment — ask about gear, locations, or credit.
              </p>
            )}
          </div>
        )}
      </div>

    </article>
  );
}

