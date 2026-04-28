"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/currency";
import { getSavedCurrency } from "@/components/currency/CurrencyPicker";

type CurrencyCode = "ZAR" | "USD" | "EUR" | "GBP";

type FxResponse =
  | { base: string; fetchedAtMs: number; rates: Record<string, number>; stale?: boolean }
  | { error: string };

function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>("ZAR");
  useEffect(() => {
    const sync = () => setCurrency(getSavedCurrency());
    sync();
    window.addEventListener("crewlink:currency", sync);
    return () => window.removeEventListener("crewlink:currency", sync);
  }, []);
  return currency;
}

function useFxRates(base: string) {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/fx/latest?base=${encodeURIComponent(base)}`)
      .then((r) => r.json())
      .then((json: FxResponse) => {
        if (cancelled) return;
        if ("rates" in json && json.rates) setRates(json.rates);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [base]);
  return rates;
}

export function ApproxMoney({
  amountZar,
  className = "",
  prefix = "≈",
}: {
  amountZar: number;
  className?: string;
  prefix?: string;
}) {
  const currency = useCurrency();
  const rates = useFxRates("ZAR");

  const converted = useMemo(() => {
    if (currency === "ZAR") return null;
    if (!rates) return null;
    const rate = rates[currency];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
    return amountZar * rate;
  }, [amountZar, currency, rates]);

  if (currency === "ZAR") return null;
  if (converted == null) return null;

  return (
    <span className={["text-[11px] text-zinc-500 dark:text-zinc-400", className].filter(Boolean).join(" ")}>
      {" "}
      {prefix} {formatMoney(converted, currency)}
    </span>
  );
}

