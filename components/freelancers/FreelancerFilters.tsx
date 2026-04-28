"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { FREELANCER_SPECIALIZATIONS, SUGGESTED_GEAR_TAGS } from "@/lib/freelancer-constants";

type Props = {
  popularGear: string[];
};

function parseList(param: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function FreelancerFilters({ popularGear }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const selectedSpec = useMemo(() => new Set(parseList(searchParams.get("spec"))), [searchParams]);
  const selectedGear = useMemo(() => new Set(parseList(searchParams.get("gear"))), [searchParams]);
  const availableOnly = searchParams.get("available") === "1";

  const pushQuery = useCallback(
    (nextSpec: Set<string>, nextGear: Set<string>, nextAvail: boolean) => {
      const params = new URLSearchParams();
      if (nextSpec.size) params.set("spec", [...nextSpec].join(","));
      if (nextGear.size) params.set("gear", [...nextGear].join(","));
      if (nextAvail) params.set("available", "1");
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/freelancers?${qs}` : "/freelancers");
      });
    },
    [router],
  );

  function toggleSpec(s: string) {
    const next = new Set(selectedSpec);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    pushQuery(next, selectedGear, availableOnly);
  }

  function toggleGear(g: string) {
    const key = g.trim().toLowerCase();
    if (!key) return;
    const next = new Set(selectedGear);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    pushQuery(selectedSpec, next, availableOnly);
  }

  function toggleAvailable() {
    pushQuery(selectedSpec, selectedGear, !availableOnly);
  }

  function clearAll() {
    startTransition(() => router.push("/freelancers"));
  }

  const gearSuggestions = useMemo(() => {
    const merged = [...new Set([...SUGGESTED_GEAR_TAGS.map((s) => s.toLowerCase()), ...popularGear.map((g) => g.toLowerCase())])];
    return merged.slice(0, 24);
  }, [popularGear]);

  return (
    <aside className="space-y-8 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          Clear all
        </button>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Available now</span>
        <input type="checkbox" checked={availableOnly} onChange={toggleAvailable} className="h-4 w-4 rounded border-zinc-300 text-sky-600" />
      </label>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Specialization</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FREELANCER_SPECIALIZATIONS.map((label) => {
            const on = selectedSpec.has(label);
            return (
              <button
                key={label}
                type="button"
                disabled={pending}
                onClick={() => toggleSpec(label)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  on
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">Match anyone with any selected role.</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Gear & tools</h3>
        <p className="mt-1 text-[11px] text-zinc-500">Tap tags to filter. Combine with specializations.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {gearSuggestions.map((g) => {
            const on = selectedGear.has(g);
            return (
              <button
                key={g}
                type="button"
                disabled={pending}
                onClick={() => toggleGear(g)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  on
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
