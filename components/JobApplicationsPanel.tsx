"use client";

import Link from "next/link";
import useSWR from "swr";

type Applicant = {
  id: string;
  name: string | null;
  image: string | null;
  profile?: { headline: string | null; specializations: string[]; location: string | null };
};

type ApplicationRow = {
  id: string;
  proposal: string;
  createdAt: string;
  user: Applicant;
};

type Response = { items: ApplicationRow[] };
type JobMeta = { id: string; status: string; invitedFreelancerId: string | null };

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed");
    return r.json() as Promise<Response>;
  });

const fetchJob = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed");
    return r.json() as Promise<JobMeta>;
  });

export function JobApplicationsPanel({ jobId }: { jobId: string }) {
  const { data, error, isLoading } = useSWR<Response>(`/api/jobs/${jobId}/applications`, fetcher, {
    revalidateOnFocus: false,
  });
  const job = useSWR<JobMeta>(`/api/jobs/${jobId}`, fetchJob, { revalidateOnFocus: false });

  async function offer(userId: string) {
    await fetch(`/api/jobs/${jobId}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await job.mutate();
  }

  async function withdraw() {
    await fetch(`/api/jobs/${jobId}/offer`, { method: "DELETE" });
    await job.mutate();
  }

  const invitedFreelancerId = job.data?.invitedFreelancerId ?? null;
  const jobStatus = job.data?.status ?? "OPEN";

  return (
    <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Applications</h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Proposals submitted by freelancers.</p>
        </div>
        {invitedFreelancerId ? (
          <button
            type="button"
            onClick={() => void withdraw()}
            disabled={jobStatus !== "OPEN"}
            className="pill-button px-3 py-2 text-xs"
          >
            Withdraw offer
          </button>
        ) : null}
      </div>

      {isLoading ? <p className="mt-4 text-sm text-zinc-500">Loading…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">Could not load applications.</p> : null}

      {!isLoading && !error && (!data?.items?.length) ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No applications yet.</p>
      ) : null}

      {data?.items?.length ? (
        <ul className="mt-5 space-y-4">
          {data.items.map((a) => (
            <li key={a.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/profile/${a.user.id}`}
                    className="block truncate text-sm font-semibold text-zinc-900 hover:text-sky-700 dark:text-white dark:hover:text-sky-300"
                  >
                    {a.user.name ?? "Freelancer"}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {a.user.profile?.headline ?? a.user.profile?.specializations?.[0] ?? "Freelancer"}
                    {a.user.profile?.location ? ` · ${a.user.profile.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                  {invitedFreelancerId === a.user.id ? (
                    <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-100">
                      Offered
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void offer(a.user.id)}
                      disabled={jobStatus !== "OPEN" || Boolean(invitedFreelancerId)}
                      className={[
                        "rounded-full px-3 py-2 text-xs font-semibold text-white",
                        jobStatus !== "OPEN" || Boolean(invitedFreelancerId)
                          ? "bg-zinc-400 dark:bg-zinc-700"
                          : "bg-emerald-600 hover:bg-emerald-500",
                      ].join(" ")}
                    >
                      Offer
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{a.proposal}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

