"use client";

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
};

export function AvailabilitySwitch({ value, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition sm:max-w-md ${
        value
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">Available now</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Show a green badge on your profile and in search.</p>
      </div>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          value ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            value ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
