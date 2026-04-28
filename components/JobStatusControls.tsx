"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = ["OPEN", "FILLED", "CLOSED"] as const;

export function JobStatusControls({ jobId, current }: { jobId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: (typeof statuses)[number]) {
    setError(null);
    setPending(true);
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not update status.");
      return;
    }
    setStatus(next);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Job status</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Current: {status}</p>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending || s === status}
            onClick={() => void save(s)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Mark {s.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
