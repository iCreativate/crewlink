"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { JobCardJob } from "@/components/JobCard";
import { JobAcceptButton } from "@/components/JobAcceptButton";
import { normalizeJobPayload } from "@/lib/normalize-job-payload";

export function FreelancerEmergencyListener() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [alertJob, setAlertJob] = useState<JobCardJob | null>(null);

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
    if (!me || me.role !== "FREELANCER") return;

    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    const onConnect = () => {
      socket.emit("join:user", me.id);
    };
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();

    socket.on("job:emergency", (payload: { job?: Record<string, unknown> }) => {
      const raw = payload?.job;
      if (!raw || typeof raw !== "object") return;
      try {
        const job = normalizeJobPayload(raw);
        if (job.status !== "OPEN") return;
        if (job.poster.id === me.id) return;
        if (job.invitedFreelancerId && job.invitedFreelancerId !== me.id) return;
        setAlertJob(job);
      } catch {
        /* ignore */
      }
    });

    socket.on("job:filled", (payload: { jobId?: string }) => {
      if (payload?.jobId) {
        setAlertJob((j) => (j && j.id === payload.jobId ? null : j));
      }
    });

    return () => {
      socket.off("connect", onConnect);
      socket.close();
    };
  }, [me?.id, me?.role]);

  if (!me || me.role !== "FREELANCER" || !alertJob) return null;

  const canAccept =
    alertJob.status === "OPEN" && alertJob.poster.id !== me.id && (!alertJob.invitedFreelancerId || alertJob.invitedFreelancerId === me.id);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-job-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-red-500 bg-white shadow-2xl dark:border-red-600 dark:bg-zinc-950">
        <div className="bg-red-600 px-4 py-3 text-center dark:bg-red-700">
          <p id="emergency-job-title" className="text-sm font-black uppercase tracking-[0.2em] text-white">
            URGENT JOB - ACCEPT NOW
          </p>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">{alertJob.title}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {alertJob.poster.name ?? "Media house"} · {alertJob.payRate ? <span>{alertJob.payRate}</span> : null}
          </p>
          {alertJob.location ? (
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{alertJob.location}</p>
          ) : null}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
            {canAccept ? (
              <JobAcceptButton
                jobId={alertJob.id}
                onAccepted={() => {
                  setAlertJob(null);
                  router.refresh();
                }}
              />
            ) : null}
            <Link
              href={`/jobs/${alertJob.id}`}
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Open job
            </Link>
            <button
              type="button"
              onClick={() => setAlertJob(null)}
              className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
