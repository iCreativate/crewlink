"use client";

import { FREELANCER_SPECIALIZATIONS } from "@/lib/freelancer-constants";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function SpecializationGrid({ value, onChange }: Props) {
  const set = new Set(value);

  function toggle(s: string) {
    const next = new Set(set);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange([...next]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FREELANCER_SPECIALIZATIONS.map((label) => {
        const active = set.has(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => toggle(label)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-sky-600 text-white shadow-sm dark:bg-sky-500"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
