"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((json: { items?: Notification[] }) => setItems(Array.isArray(json.items) ? json.items : []))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  }

  if (loading) return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>;

  if (!items.length) return <p className="text-sm text-zinc-500 dark:text-zinc-400">No notifications yet.</p>;

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
                <a href={n.href} className="mt-2 inline-block text-xs font-semibold text-sky-700 hover:underline dark:text-sky-400">
                  Open
                </a>
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

