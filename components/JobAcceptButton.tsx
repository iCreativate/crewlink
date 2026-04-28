"use client";

import { useState } from "react";

type Props = {
  jobId: string;
  compact?: boolean;
  onAccepted?: () => void;
  label?: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
};

export function JobAcceptButton({ jobId, compact, onAccepted, label, pendingLabel, variant = "primary" }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setError(null);
    setPending(true);
    const res = await fetch(`/api/jobs/${jobId}/accept`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!res.ok) {
      if (res.status === 409) {
        setError(data.error === "race_lost" ? "Someone just accepted this job." : "This job is no longer open.");
      } else if (res.status === 403) {
        setError(
          data.error === "not_invited"
            ? "This role was offered to another freelancer."
            : "You can’t accept your own listing.",
        );
      } else {
        setError("Could not accept. Try again.");
      }
      return;
    }
    onAccepted?.();
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => void accept()}
        className={[
          "rounded-full font-semibold shadow-sm transition disabled:opacity-50",
          compact ? "px-4 py-2 text-sm" : "px-6 py-2.5 text-sm",
          variant === "secondary"
            ? "bg-white/70 text-emerald-900 ring-1 ring-emerald-300/60 hover:bg-white dark:bg-emerald-950/20 dark:text-emerald-100 dark:ring-emerald-900/60 dark:hover:bg-emerald-950/35"
            : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500",
        ].join(" ")}
      >
        {pending ? pendingLabel ?? "Submitting…" : label ?? "Apply"}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
