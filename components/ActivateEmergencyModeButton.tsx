"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActivateEmergencyModeButton({ jobId, alreadyActive }: { jobId: string; alreadyActive?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setError(null);
    setPending(true);
    const res = await fetch(`/api/jobs/${jobId}/emergency`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string; notifiedCount?: number };
    setPending(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not activate emergency mode.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 dark:border-red-900/60 dark:bg-red-950/30">
      <p className="text-sm font-semibold text-red-900 dark:text-red-100">Emergency mode</p>
      <p className="mt-1 text-xs text-red-800/90 dark:text-red-200/85">
        {alreadyActive
          ? "This listing is marked urgent. Send another real-time WebSocket blast to nearby freelancers."
          : "Notify nearby freelancers instantly over WebSockets with an urgent alert. The first accepted freelancer fills the job and locks everyone else out."}
      </p>
      {error ? <p className="mt-2 text-xs text-red-700 dark:text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void activate()}
        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
      >
        {pending ? "Sending…" : alreadyActive ? "Send another urgent broadcast" : "Activate emergency broadcast"}
      </button>
    </div>
  );
}
