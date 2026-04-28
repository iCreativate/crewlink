"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GearTagField } from "@/components/profile/GearTagField";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostJobForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 86400000)));
  const [location, setLocation] = useState("");
  const [payRate, setPayRate] = useState("");
  const [gearRequirements, setGearRequirements] = useState<string[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || "",
        startsAt: new Date(startsAt).toISOString(),
        location: location || null,
        payRate,
        gearRequirements,
        emergencyMode,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: unknown; id?: string };
    setPending(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not publish job.");
      return;
    }
    router.push(`/jobs/${data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10"
    >
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Post a job</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Set when and where you need crew, pay rate, and required gear. Freelancers see new posts instantly over WebSockets.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Title
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Date & time
        <input
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Location
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          placeholder="Set, city, or remote"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Pay rate
        <input
          required
          value={payRate}
          onChange={(e) => setPayRate(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          placeholder="e.g. R6,500/10hr · R4,000 flat · union scale"
        />
      </label>

      <div>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Gear requirements</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tag cameras, audio, lighting, or software you expect.</p>
        <div className="mt-3">
          <GearTagField value={gearRequirements} onChange={setGearRequirements} />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
        <input
          type="checkbox"
          checked={emergencyMode}
          onChange={(e) => setEmergencyMode(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
        />
        <span>
          <span className="block text-sm font-semibold text-red-900 dark:text-red-100">Emergency mode</span>
          <span className="mt-0.5 block text-xs text-red-800/90 dark:text-red-200/80">
            Immediately alert nearby freelancers with &quot;URGENT JOB - ACCEPT NOW&quot; over WebSockets. First accept wins.
          </span>
        </span>
      </label>

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Description / call notes (optional)
        <textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          placeholder="Shot list, parking, PPE, union notes…"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-indigo-500 disabled:opacity-60"
      >
        {pending ? "Publishing…" : "Publish job"}
      </button>
    </form>
  );
}
