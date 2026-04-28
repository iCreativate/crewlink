"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GearTagField } from "@/components/profile/GearTagField";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  templateId: string;
};

export function BookCrewFromTemplateForm({ templateId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 86400000)));
  const [location, setLocation] = useState("");
  const [payRate, setPayRate] = useState("");
  const [gearRequirements, setGearRequirements] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch(`/api/crew-templates/${templateId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || "",
        startsAt: new Date(startsAt).toISOString(),
        location: location || null,
        payRate,
        gearRequirements,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: unknown; jobs?: { id: string }[] };
    setPending(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not book crew.");
      return;
    }
    const first = data.jobs?.[0]?.id;
    if (first) router.push(`/jobs/${first}`);
    else router.push("/dashboard/jobs");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Book entire crew</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          One action creates one open job per role. Titles look like{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">“Your gig title — Role name”</span>. Assigned
          freelancers only see their direct offer; open roles appear on the public board.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Gig title (shared prefix)
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          placeholder="e.g. Acme keynote livestream"
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
          placeholder="Venue or remote"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Pay rate
        <input
          required
          value={payRate}
          onChange={(e) => setPayRate(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          placeholder="Same for all roles in this booking (you can edit individual jobs later)"
        />
      </label>

      <div>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Gear requirements</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Applied to every job in this booking.</p>
        <div className="mt-3">
          <GearTagField value={gearRequirements} onChange={setGearRequirements} />
        </div>
      </div>

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Description / call notes (optional)
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60"
      >
        {pending ? "Booking…" : "Book crew (create all jobs)"}
      </button>
    </form>
  );
}
