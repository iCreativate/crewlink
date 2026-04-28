"use client";

import { useEffect, useMemo, useState } from "react";

type CurrencyCode = "ZAR" | "USD" | "EUR" | "GBP";

const KEY = "crewlink:currency";

function guessDefaultCurrency(): CurrencyCode {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const locale = (navigator.language ?? "").toUpperCase();
  if (tz.includes("Johannesburg") || tz.startsWith("Africa/") || locale.includes("ZA")) return "ZAR";
  // Safe default for non-ZA audiences.
  return "USD";
}

export function getSavedCurrency(): CurrencyCode {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === "ZAR" || raw === "USD" || raw === "EUR" || raw === "GBP") return raw;
  } catch {
    // ignore
  }
  return guessDefaultCurrency();
}

export function CurrencyPicker() {
  const [value, setValue] = useState<CurrencyCode>("ZAR");

  useEffect(() => {
    setValue(getSavedCurrency());
  }, []);

  const options = useMemo(
    () =>
      [
        { id: "ZAR" as const, label: "ZAR (R)" },
        { id: "USD" as const, label: "USD ($)" },
        { id: "EUR" as const, label: "EUR (€)" },
        { id: "GBP" as const, label: "GBP (£)" },
      ] satisfies Array<{ id: CurrencyCode; label: string }>,
    [],
  );

  return (
    <label className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 sm:flex">
      <span className="text-slate-400">Currency</span>
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value as CurrencyCode;
          setValue(next);
          try {
            window.localStorage.setItem(KEY, next);
          } catch {
            // ignore
          }
          // Let interested components react without pulling in state libs.
          window.dispatchEvent(new Event("crewlink:currency"));
        }}
        className="bg-transparent text-slate-100 outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id} className="text-zinc-900">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

