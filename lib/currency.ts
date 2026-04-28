export type CurrencyCode = "ZAR" | "USD" | "EUR" | "GBP";

export function formatMoney(amount: number, currency: CurrencyCode, locale?: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Extremely defensive: if Intl/currency unsupported, fall back.
    const symbol = currency === "ZAR" ? "R" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
}

export function formatZar(amount: number, locale?: string) {
  // ZA locale ensures correct grouping for most users; still respects optional locale override.
  return formatMoney(amount, "ZAR", locale ?? "en-ZA");
}

