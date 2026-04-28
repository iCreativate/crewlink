"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import useSWR from "swr";
import { JobCard, type JobCardJob } from "@/components/JobCard";
import { normalizeJobPayload } from "@/lib/normalize-job-payload";

class JobsFeedError extends Error {
  readonly hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = "JobsFeedError";
    this.hint = hint;
  }
}

async function jobsFetcher(url: string): Promise<Record<string, unknown>[]> {
  const r = await fetch(url);
  const body: unknown = await r.json().catch(() => null);

  if (!r.ok) {
    const obj = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const hint = typeof obj.hint === "string" ? obj.hint : undefined;
    const msg = typeof obj.error === "string" ? obj.error : "Could not load jobs.";
    throw new JobsFeedError(msg, hint);
  }

  if (!Array.isArray(body)) {
    throw new JobsFeedError("Unexpected response from the jobs API.", "Check the server terminal for [GET /api/jobs] errors.");
  }

  return body;
}

function normalizeJob(j: Record<string, unknown>): JobCardJob {
  return normalizeJobPayload(j);
}

export function JobFeed() {
  const [near, setNear] = useState<string | null>(null);
  const [nearLabel, setNearLabel] = useState<string | null>(null);
  const jobsUrl = useMemo(() => (near ? `/api/jobs?near=${encodeURIComponent(near)}` : "/api/jobs"), [near]);

  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>[]>(jobsUrl, jobsFetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const [prepend, setPrepend] = useState<JobCardJob[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [socketOk, setSocketOk] = useState(false);
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const meRef = useRef(me);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    meRef.current = me;
  }, [me]);

  useEffect(() => {
    void fetch("/api/me", { credentials: "include" })
      .then((r) => r.json().catch(() => null))
      .then((u: { authenticated?: boolean; id?: string; role?: string } | null) => {
        if (u?.authenticated && typeof u.id === "string" && typeof u.role === "string") {
          setMe({ id: u.id, role: u.role });
        } else {
          setMe(null);
        }
      })
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const joinUserRoom = () => {
      const u = meRef.current;
      if (u?.role === "FREELANCER" && u.id) socket.emit("join:user", u.id);
    };

    socket.on("connect", () => {
      setSocketOk(true);
      joinUserRoom();
    });
    socket.on("disconnect", () => setSocketOk(false));

    socket.on("job:new", (raw: Record<string, unknown>) => {
      try {
        const job = normalizeJob(raw);
        setPrepend((p) => [job, ...p.filter((x) => x.id !== job.id)]);
        void mutate();
      } catch {
        /* ignore */
      }
    });

    socket.on("job:patch", (payload: { jobId?: string; emergencyMode?: boolean }) => {
      if (!payload?.jobId) return;
      setPrepend((p) =>
        p.map((j) => (j.id === payload.jobId ? { ...j, emergencyMode: payload.emergencyMode ?? true } : j)),
      );
      void mutate();
    });

    socket.on("job:filled", (payload: { jobId?: string }) => {
      if (payload?.jobId) {
        setRemovedIds((prev) => new Set(prev).add(payload.jobId!));
        setPrepend((p) => p.filter((j) => j.id !== payload.jobId));
        void mutate();
      }
    });

    return () => {
      socketRef.current = null;
      socket.close();
    };
  }, [mutate]);

  useEffect(() => {
    const s = socketRef.current;
    if (s?.connected && me?.role === "FREELANCER" && me.id) {
      s.emit("join:user", me.id);
    }
  }, [me?.id, me?.role]);

  const jobs = useMemo(() => {
    const base = (data ?? []).map(normalizeJob).filter((j) => !removedIds.has(j.id));
    const ids = new Set(base.map((j) => j.id));
    const fromSocket = prepend.filter((j) => !removedIds.has(j.id) && !ids.has(j.id));
    const merged = [...fromSocket, ...base];
    return merged.sort((a, b) => {
      const ta = a.startsAt ? new Date(a.startsAt).getTime() : Infinity;
      const tb = b.startsAt ? new Date(b.startsAt).getTime() : Infinity;
      if (ta !== tb) return ta - tb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data, prepend, removedIds]);

  const showAccept = me?.role === "FREELANCER";

  async function enableNearMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const res = await fetch(`/api/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`);
        const json = (await res.json().catch(() => null)) as
          | { label?: string; city?: string | null; region?: string | null; countryCode?: string | null }
          | null;

        const city = typeof json?.city === "string" ? json.city : null;
        const region = typeof json?.region === "string" ? json.region : null;
        const label = typeof json?.label === "string" ? json.label : null;

        const query = [city, region].filter(Boolean).join(", ");
        setNear(query.length ? query : label ?? "Near me");
        setNearLabel(label ?? query ?? "Near me");
      },
      () => {
        // user denied / error - do nothing
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 30 },
    );
  }

  if (isLoading && !jobs.length) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    );
  }

  if (error) {
    const hint = error instanceof JobsFeedError ? error.hint : undefined;
    const message = error instanceof Error ? error.message : "Could not load the job feed.";
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm dark:border-red-900/60 dark:bg-red-950/30">
        <p className="font-medium text-red-900 dark:text-red-100">{message}</p>
        {hint ? (
          <p className="mt-3 text-red-800/95 dark:text-red-200/90">
            <span className="font-semibold">Fix:</span> {hint}
          </p>
        ) : (
          <p className="mt-3 text-red-800/90 dark:text-red-200/85">
            Confirm Postgres is running and <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/50">DATABASE_URL</code> in{" "}
            <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/50">.env</code> is correct, then run{" "}
            <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/50">npx prisma migrate deploy</code>.
          </p>
        )}
        <button
          type="button"
          onClick={() => void mutate()}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        No open roles yet. Media houses can post the first opportunity from the dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-sky-700 dark:text-sky-300">
          Live feed · {socketOk ? "WebSocket connected" : "Connecting…"} · backup refresh every 60s
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {nearLabel ? (
            <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
              Near: <span className="text-slate-300">{nearLabel}</span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void enableNearMe()}
            className="pill-button px-3 py-2 text-xs"
          >
            Near me
          </button>
          {near ? (
            <button
              type="button"
              onClick={() => {
                setNear(null);
                setNearLabel(null);
              }}
              className="pill-button px-3 py-2 text-xs"
            >
              Show all
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            showAccept={showAccept}
            currentUserId={me?.id ?? null}
            onJobFilled={(id) => {
              setRemovedIds((prev) => new Set(prev).add(id));
              setPrepend((p) => p.filter((j) => j.id !== id));
              void mutate();
            }}
          />
        ))}
      </div>
    </div>
  );
}
