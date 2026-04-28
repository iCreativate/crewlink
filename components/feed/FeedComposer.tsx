"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  viewer?: { name: string | null; image: string | null };
  viewerRole?: "FREELANCER" | "MEDIA_HOUSE" | null;
  onPosted?: () => void;
};

function Avatar({ viewer }: { viewer?: { name: string | null; image: string | null } }) {
  if (viewer?.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={viewer.image} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  const initial = (viewer?.name ?? "Y")[0]?.toUpperCase() ?? "Y";
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-100 text-xs font-semibold text-zinc-700 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-200">
      {initial}
    </div>
  );
}

function QuickAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pill-button inline-flex items-center gap-2 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
    >
      <span className="text-zinc-500 dark:text-zinc-300">{icon}</span>
      {label}
    </button>
  );
}

export function FeedComposer({ onPosted, viewer, viewerRole }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isAd, setIsAd] = useState(false);
  const [adType, setAdType] = useState<"SPONSORED_POST" | "OPPORTUNITY" | "FEATURED_CREATOR">("SPONSORED_POST");
  const [ctaLabel, setCtaLabel] = useState("Learn more");
  const [ctaHref, setCtaHref] = useState("");
  const [bts, setBts] = useState(false);
  const [collab, setCollab] = useState(false);
  const [collabNote, setCollabNote] = useState("");
  const [location, setLocation] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionItems, setMentionItems] = useState<Array<{ id: string; name: string | null; image: string | null; role: string; profile?: { headline: string | null } }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canPost = useMemo(() => body.trim().length > 0 && !pending, [body, pending]);

  useEffect(() => {
    if (!showCollaborators) return;
    const segment = collaborators.split(",").slice(-1)[0] ?? "";
    const at = segment.lastIndexOf("@");
    if (at === -1) {
      setMentionQuery("");
      setMentionItems(null);
      return;
    }
    const q = segment.slice(at + 1).trim();
    if (!q) {
      setMentionQuery("");
      setMentionItems(null);
      return;
    }
    setMentionQuery(q);

    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((json: { items?: any[] }) => {
          const items = Array.isArray(json.items) ? (json.items as any[]) : [];
          setMentionItems(
            items.map((it) => ({
              id: String(it.id),
              name: typeof it.name === "string" ? it.name : null,
              image: typeof it.image === "string" ? it.image : null,
              role: typeof it.role === "string" ? it.role : "FREELANCER",
              profile: it.profile ? { headline: typeof it.profile.headline === "string" ? it.profile.headline : null } : undefined,
            })),
          );
        })
        .catch(() => {
          setMentionItems(null);
        });
    }, 160);

    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [collaborators, showCollaborators]);

  async function submit() {
    if (!canPost) return;
    setPending(true);
    setError(null);

    let mediaUrl: string | null = null;
    let mediaType: "IMAGE" | "VIDEO" | null = null;
    let mediaItems: Array<{ mediaType: "IMAGE" | "VIDEO"; url: string }> | null = null;
    const bodyToSend = body.trim();

    if (files.length) {
      const uploaded: Array<{ mediaType: "IMAGE" | "VIDEO"; url: string }> = [];
      for (const f of files.slice(0, 10)) {
        const fd = new FormData();
        fd.append("file", f);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upJson = (await up.json().catch(() => ({}))) as { url?: string; mediaType?: string; error?: string };
        if (!up.ok || !upJson.url || (upJson.mediaType !== "IMAGE" && upJson.mediaType !== "VIDEO")) {
          setPending(false);
          setError(upJson.error || "Upload failed.");
          return;
        }
        uploaded.push({ mediaType: upJson.mediaType as "IMAGE" | "VIDEO", url: upJson.url });
      }

      if (uploaded.length === 1) {
        mediaUrl = uploaded[0]!.url;
        mediaType = uploaded[0]!.mediaType;
      } else {
        mediaItems = uploaded;
      }
    }

    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: bodyToSend,
        mediaUrl,
        mediaType,
        mediaItems,
        kind: isAd && viewerRole === "MEDIA_HOUSE" ? "AD" : "POST",
        adType: isAd && viewerRole === "MEDIA_HOUSE" ? adType : null,
        ctaLabel: isAd && viewerRole === "MEDIA_HOUSE" ? (ctaLabel.trim() || null) : null,
        ctaHref: isAd && viewerRole === "MEDIA_HOUSE" ? (ctaHref.trim() || null) : null,
        bts,
        collab,
        collabNote: collab ? collabNote.trim() || null : null,
        location: location.trim() || null,
        collaborators: collaborators
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 8),
      }),
    });

    if (!res.ok) {
      setPending(false);
      setError("Could not post to the feed.");
      return;
    }

    setBody("");
    setFiles([]);
    setIsAd(false);
    setAdType("SPONSORED_POST");
    setCtaLabel("Learn more");
    setCtaHref("");
    setBts(false);
    setCollab(false);
    setCollabNote("");
    setLocation("");
    setCollaborators("");
    setShowLocation(false);
    setShowCollaborators(false);
    setPending(false);
    onPosted?.();
    router.refresh();
  }

  return (
    <section className="composer-card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Avatar viewer={viewer} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="surface-soft p-3 focus-within:ring-2 focus-within:ring-sky-500/30">
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your work, wins, or collaborations…"
              className="w-full resize-y bg-transparent px-1 text-[15px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-white dark:placeholder:text-zinc-400"
            />
            {showLocation ? (
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (optional) — e.g. Cape Town"
                className="mt-3 w-full rounded-2xl bg-white/60 px-3 py-2 text-sm text-zinc-900 outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-sky-500/30 dark:bg-zinc-950/35 dark:text-white dark:ring-white/10"
              />
            ) : null}
            {showCollaborators ? (
              <div className="relative mt-3">
                <input
                  value={collaborators}
                  onChange={(e) => setCollaborators(e.target.value)}
                  placeholder="Collaborators (comma-separated) — type @ to search"
                  className="w-full rounded-2xl bg-white/60 px-3 py-2 text-sm text-zinc-900 outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-sky-500/30 dark:bg-zinc-950/35 dark:text-white dark:ring-white/10"
                />
                {mentionQuery && mentionItems && mentionItems.length > 0 ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl bg-white/90 shadow-xl ring-1 ring-black/10 backdrop-blur dark:bg-zinc-950/80 dark:ring-white/10">
                    {mentionItems.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5"
                        onClick={() => {
                          const parts = collaborators.split(",");
                          const last = (parts.pop() ?? "").trimEnd();
                          const at = last.lastIndexOf("@");
                          const prefix = at === -1 ? last : last.slice(0, at);
                          const handle = `@${(u.name ?? "user").replace(/\s+/g, "")}`;
                          const nextLast = `${prefix}${handle}`;
                          const next = [...parts, nextLast].map((p) => p.trim()).filter(Boolean).join(", ");
                          setCollaborators(next + (next.endsWith(",") ? " " : ""));
                          setMentionItems(null);
                          setMentionQuery("");
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {u.image ? <img src={u.image} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{u.name ?? "User"}</p>
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {u.profile?.headline?.trim() || u.role}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {collab ? (
              <input
                value={collabNote}
                onChange={(e) => setCollabNote(e.target.value)}
                placeholder="Add a collab note (optional) — “Need an editor in Cape Town next week.”"
                className="mt-3 w-full rounded-2xl bg-white/60 px-3 py-2 text-sm text-zinc-900 outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-emerald-500/30 dark:bg-zinc-950/35 dark:text-white dark:ring-white/10"
              />
            ) : null}
          </div>

          {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          {viewerRole === "MEDIA_HOUSE" ? (
            <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Promote</p>
                <button
                  type="button"
                  onClick={() => setIsAd((v) => !v)}
                  className={[
                    "rounded-full px-3 py-2 text-xs font-semibold transition",
                    isAd ? "bg-amber-500 text-black" : "pill-button",
                  ].join(" ")}
                >
                  {isAd ? "Ad enabled" : "Create ad"}
                </button>
              </div>

              {isAd ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Ad type
                    <select
                      value={adType}
                      onChange={(e) => setAdType(e.target.value as any)}
                      className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none"
                    >
                      <option value="SPONSORED_POST">Sponsored post</option>
                      <option value="OPPORTUNITY">Opportunity</option>
                      <option value="FEATURED_CREATOR">Featured creator</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-300">
                    CTA label
                    <input
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none"
                      placeholder="Apply / Book / Learn more"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-300 sm:col-span-2">
                    CTA link
                    <input
                      value={ctaHref}
                      onChange={(e) => setCtaHref(e.target.value)}
                      className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none"
                      placeholder="https://... or /jobs/123 or /profile/abc"
                    />
                  </label>
                  <p className="meta-text sm:col-span-2">Tip: write the headline/offer in the post text above.</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  onChange={(e) => {
                    const next = Array.from(e.target.files ?? []).slice(0, 10);
                    setFiles(next);
                  }}
                  multiple
                  className="hidden"
                />
                <span className="pill-button inline-flex items-center gap-2 px-3 py-2 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-300">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path
                        d="M7 7h10l1 2h2v10H4V9h2l1-2z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </span>
                  {files.length ? `${files.length} media` : "Photo / video"}
                </span>
              </label>
              <QuickAction
                label="Tag collaborators"
                icon={
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M22 21v-2a4 4 0 0 0-3-3.87"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 3.13a4 4 0 0 1 0 7.75"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                onClick={() => setShowCollaborators((v) => !v)}
              />
              <QuickAction
                label="Add location"
                icon={
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      d="M12 22s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                  </svg>
                }
                onClick={() => setShowLocation((v) => !v)}
              />
              <button
                type="button"
                onClick={() => setCollab((v) => !v)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2",
                  collab
                    ? "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500/30"
                    : "pill-button px-3 py-2 text-xs focus-visible:ring-sky-500/30",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-2 w-2 rounded-full",
                    collab ? "bg-white" : "bg-emerald-500/80 dark:bg-emerald-400/70",
                  ].join(" ")}
                />
                Open to collab
              </button>

              <button
                type="button"
                onClick={() => setBts((v) => !v)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2",
                  bts
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500/30"
                    : "pill-button px-3 py-2 text-xs focus-visible:ring-sky-500/30",
                ].join(" ")}
              >
                Show & tell
              </button>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!canPost}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-sky-500 to-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/20 transition hover:from-sky-400 hover:to-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:opacity-50 dark:shadow-sky-400/10"
            >
              {pending ? "Posting…" : "Post"}
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M5 12h12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <path
                  d="M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

