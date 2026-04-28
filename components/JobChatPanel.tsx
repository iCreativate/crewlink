"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string | null; image: string | null; role: string };
};

export function JobChatPanel({ jobId, viewerId }: { jobId: string; viewerId: string }) {
  const [items, setItems] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => body.trim().length > 0 && !busy, [body, busy]);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/messages`);
    if (!res.ok) {
      setReady(true);
      setError("Messaging isn’t available for this job yet.");
      return;
    }
    const json = (await res.json().catch(() => null)) as null | { items?: Message[] };
    setItems(Array.isArray(json?.items) ? json!.items! : []);
    setReady(true);
    queueMicrotask(() => endRef.current?.scrollIntoView({ block: "end" }));
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = useCallback(async () => {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });
    const json = (await res.json().catch(() => null)) as any;
    setBusy(false);
    if (!res.ok) {
      setError(json?.error === "no_recipient" ? "Waiting for the other party (no recipient yet)." : "Could not send message.");
      return;
    }
    setItems((prev) => [...prev, json as Message]);
    setBody("");
    queueMicrotask(() => endRef.current?.scrollIntoView({ block: "end" }));
  }, [body, canSend, jobId]);

  if (!ready) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        Loading messages…
      </div>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Messages</h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Chat with the other party about this gig.</p>
        </div>
        <button type="button" onClick={() => void load()} className="pill-button px-3 py-2 text-xs">
          Refresh
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="mt-4 max-h-[280px] space-y-2 overflow-auto rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200/70 dark:bg-zinc-900/35 dark:ring-zinc-800">
        {items.length ? (
          items.map((m) => {
            const mine = m.senderId === viewerId;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "bg-sky-600 text-white"
                      : "bg-white text-zinc-900 ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-800",
                  ].join(" ")}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className={["mt-1 text-[10px] opacity-80", mine ? "text-white/80" : "text-zinc-500 dark:text-zinc-400"].join(" ")}>
                    {m.sender?.name ?? "User"} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">No messages yet.</p>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="w-full rounded-2xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-zinc-200/70 outline-none focus:ring-2 focus:ring-sky-500/30 dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-800"
        />
        <button
          type="button"
          disabled={!canSend}
          onClick={() => void send()}
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </section>
  );
}

