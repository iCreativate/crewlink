"use client";

import { useCallback, useState } from "react";

const DURATIONS: Array<{ label: string; minutes: number }> = [
  { label: "1 hour", minutes: 60 },
  { label: "6 hours", minutes: 60 * 6 },
  { label: "24 hours", minutes: 60 * 24 },
  { label: "7 days", minutes: 60 * 24 * 7 },
];

export function BoostPostButton({ postId }: { postId: string }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const boost = useCallback(
    async (minutes: number) => {
      if (busy) return;
      setBusy(true);
      const res = await fetch(`/api/feed/${encodeURIComponent(postId)}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      });
      setBusy(false);
      setOpen(false);
      setToast(res.ok ? "Post boosted." : "Could not boost post.");
      window.setTimeout(() => setToast(null), 1600);
    },
    [busy, postId],
  );

  const stop = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/feed/${encodeURIComponent(postId)}/boost`, { method: "DELETE" });
    setBusy(false);
    setOpen(false);
    setToast(res.ok ? "Boost removed." : "Could not remove boost.");
    window.setTimeout(() => setToast(null), 1600);
  }, [busy, postId]);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="pill-button px-3 py-2 text-xs">
        Boost
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-40 w-[220px] rounded-2xl bg-white p-2 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Pin to top
          </p>
          <div className="grid gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d.minutes}
                type="button"
                onClick={() => void boost(d.minutes)}
                disabled={busy}
                className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-60 dark:text-white dark:hover:bg-zinc-900"
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void stop()}
              disabled={busy}
              className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Remove boost
            </button>
          </div>
        </div>
      ) : null}
      {toast ? <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">{toast}</div> : null}
    </div>
  );
}

