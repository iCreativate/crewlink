"use client";

import { useState } from "react";

type Props = {
  jobId: string;
  compact?: boolean;
  onApplied?: () => void;
};

export function JobApplyButton({ jobId, compact, onApplied }: Props) {
  const [open, setOpen] = useState(false);
  const [proposal, setProposal] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minLen = 30;

  async function submit() {
    setError(null);
    const text = proposal.trim();
    if (text.length < minLen) {
      setError(`Please write at least ${minLen} characters.`);
      return;
    }
    setPending(true);
    const res = await fetch(`/api/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal: text }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!res.ok) {
      if (res.status === 409) {
        setError(data.error === "already_applied" ? "You already applied to this job." : "This job is no longer open.");
      } else if (res.status === 403) {
        setError(data.error === "not_invited" ? "This role was offered to another freelancer." : "You can’t apply to your own listing.");
      } else {
        setError("Could not submit. Try again.");
      }
      return;
    }
    setOpen(false);
    setProposal("");
    onApplied?.();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-white shadow-md transition hover:from-emerald-500 hover:to-teal-500 ${
          compact ? "px-4 py-2 text-sm" : "px-6 py-2.5 text-sm"
        }`}
      >
        Apply
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">Submit proposal</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Explain why you’re a great fit. Keep it concise and production-focused.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (pending) return;
                  setOpen(false);
                  setError(null);
                }}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                rows={6}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder="Include relevant experience, links to work, availability, and gear if applicable."
                className="w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm leading-relaxed text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-white"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {proposal.trim().length}/{4000} (min {minLen})
                </p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void submit()}
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                >
                  {pending ? "Submitting…" : "Submit"}
                </button>
              </div>
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

