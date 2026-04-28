"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type FeedTab = "following" | "for-you" | "collabs";

const tabs: Array<{ id: FeedTab; label: string }> = [
  { id: "following", label: "Following" },
  { id: "for-you", label: "For you" },
  { id: "collabs", label: "Collabs" },
];

export function FeedTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const active = useMemo(() => {
    const raw = (params.get("tab") ?? "for-you").toLowerCase();
    if (raw === "following") return "following";
    if (raw === "collabs") return "collabs";
    return "for-you";
  }, [params]);

  const setTab = useCallback(
    (tab: FeedTab) => {
      const next = new URLSearchParams(params.toString());
      next.set("tab", tab);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <div className="action-row">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "pill-button px-4 py-2 text-sm",
              isActive
                ? "border-sky-400/40 bg-sky-500/10 text-sky-100 dark:border-sky-400/35 dark:bg-sky-400/10"
                : "",
            ].join(" ")}
            aria-pressed={isActive}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

