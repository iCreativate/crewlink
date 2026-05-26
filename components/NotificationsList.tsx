"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { readApiError } from "@/lib/http";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsList() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.status === 401) {
        setError("Sign in to view notifications.");
        setItems([]);
        return;
      }
      if (!res.ok) {
        setError(await readApiError(res, "Could not load notifications."));
        setItems([]);
        return;
      }
      const json = (await res.json()) as { items?: Notification[] };
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      setError("Could not load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm dark:border-red-900/60 dark:bg-red-950/30">
        <p className="text-red-900 dark:text-red-100">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p>No notifications yet.</p>
        <p className="mt-2">When you receive offers or messages, they will appear here.</p>
        <Link href="/jobs" className="mt-4 inline-block text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400">
          Browse jobs
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((n) => (
        <li
          key={n.id}
          className={[
            "rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-950",
            n.readAt ? "border-zinc-200/70 dark:border-zinc-800" : "border-sky-200 dark:border-sky-900/60",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{n.title}</p>
              {n.body ? <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{n.body}</p> : null}
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{new Date(n.createdAt).toLocaleString()}</p>
              {n.href ? (
                <Link
                  href={n.href}
                  className="mt-2 inline-block text-xs font-semibold text-sky-700 hover:underline dark:text-sky-400"
                >
                  Open
                </Link>
              ) : null}
            </div>
            {!n.readAt ? (
              <button type="button" onClick={() => void markRead(n.id)} className="pill-button px-3 py-2 text-xs">
                Mark read
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
