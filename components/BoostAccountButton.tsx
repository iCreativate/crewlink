"use client";

import { useCallback, useState } from "react";

const DURATIONS: Array<{ label: string; minutes: number }> = [
  { label: "1 day", minutes: 60 * 24 },
  { label: "7 days", minutes: 60 * 24 * 7 },
  { label: "30 days", minutes: 60 * 24 * 30 },
];

export function BoostAccountButton() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const boost = useCallback(async (minutes: number) => {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/me/boost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes }),
    });
    setBusy(false);
    setToast(res.ok ? "Account boosted." : "Could not boost account.");
    window.setTimeout(() => setToast(null), 1600);
  }, [busy]);

  const stop = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/me/boost", { method: "DELETE" });
    setBusy(false);
    setToast(res.ok ? "Boost removed." : "Could not remove boost.");
    window.setTimeout(() => setToast(null), 1600);
  }, [busy]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {DURATIONS.map((d) => (
        <button
          key={d.minutes}
          type="button"
          onClick={() => void boost(d.minutes)}
          disabled={busy}
          className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
        >
          Boost {d.label}
        </button>
      ))}
      <button type="button" onClick={() => void stop()} disabled={busy} className="pill-button px-3 py-2 text-xs">
        Remove boost
      </button>
      {toast ? <span className="text-xs text-zinc-500 dark:text-zinc-400">{toast}</span> : null}
    </div>
  );
}

