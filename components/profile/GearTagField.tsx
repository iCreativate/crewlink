"use client";

import { useState } from "react";
import { SUGGESTED_GEAR_TAGS } from "@/lib/freelancer-constants";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function GearTagField({ value, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!t || t.length > 40) return;
    if (value.includes(t)) return;
    if (value.length >= 40) return;
    onChange([...value, t]);
    setDraft("");
  }

  function removeTag(t: string) {
    onChange(value.filter((x) => x !== t));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    }
    if (e.key === "Backspace" && !draft && value.length) {
      removeTag(value[value.length - 1]!);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white">
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && addTag(draft)}
          placeholder={value.length ? "" : "Type and press Enter — e.g. Sony FX6, G&E package…"}
          className="min-w-[12rem] flex-1 border-0 bg-transparent py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Quick add</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_GEAR_TAGS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              disabled={value.includes(s.toLowerCase())}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:border-sky-300 hover:text-sky-800 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-sky-700 dark:hover:text-sky-300"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
