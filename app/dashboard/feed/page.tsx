import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/server";
import { JobFeed } from "@/components/JobFeed";

export default async function FreelancerFeedPage() {
  // NOTE: layout already enforces role + onboarding, but we still need the viewer id here.
  const { appUser } = await requireRole("FREELANCER", "/dashboard/jobs");

  const [accepted, applications] = await Promise.all([
    prisma.job.findMany({
      where: { acceptedById: appUser.id },
      orderBy: [{ acceptedAt: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: { poster: { select: { id: true, name: true, image: true } } },
    }),
    prisma.jobApplication.findMany({
      where: { userId: appUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { job: { include: { poster: { select: { id: true, name: true, image: true } } } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Your feed</h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Open roles from media houses, updated in near real time. Manage your portfolio from the dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/freelancers"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Browse freelancers
          </Link>
          <Link
            href="/portfolio/manage"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Portfolio
          </Link>
          <Link
            href="/profile/edit"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Edit profile
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Accepted jobs</h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Jobs you’ve accepted and are booked for.</p>
            </div>
            <Link href="/jobs" className="text-xs font-semibold text-sky-700 hover:underline dark:text-sky-400">
              Browse jobs
            </Link>
          </div>
          {accepted.length ? (
            <ul className="mt-4 space-y-2">
              {accepted.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-sm ring-1 ring-zinc-200/70 transition hover:bg-zinc-100 dark:bg-zinc-900/40 dark:ring-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-zinc-900 dark:text-white">{j.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {j.poster?.name ?? "Media house"} {j.location ? `· ${j.location}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                      {j.acceptedAt ? new Date(j.acceptedAt).toLocaleDateString() : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No accepted jobs yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Jobs you applied for</h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Your recent applications.</p>
            </div>
          </div>
          {applications.length ? (
            <ul className="mt-4 space-y-2">
              {applications.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/jobs/${a.jobId}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-sm ring-1 ring-zinc-200/70 transition hover:bg-zinc-100 dark:bg-zinc-900/40 dark:ring-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-zinc-900 dark:text-white">{a.job.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {a.job.poster?.name ?? "Media house"} {a.job.location ? `· ${a.job.location}` : ""} · {a.job.status}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No applications yet.</p>
          )}
        </section>
      </div>

      <div className="mt-10">
        <JobFeed />
      </div>
    </div>
  );
}
