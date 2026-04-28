import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/server";

export default async function MediaJobDashboardPage() {
  const { appUser } = await requireRole("MEDIA_HOUSE", "/dashboard/feed");

  const jobs = await prisma.job.findMany({
    where: { posterId: appUser.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Job dashboard</h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Post listings and track status. Freelancers discover open roles on the public jobs page and in their feed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/jobs/new"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Post a job
          </Link>
          <Link
            href="/portfolio"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Portfolio
          </Link>
          <Link
            href="/dashboard/crew"
            className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-950"
          >
            Crew builder
          </Link>
          <Link
            href="/jobs"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Public job board
          </Link>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Your listings</h2>
        {jobs.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
            You have not posted a job yet.{" "}
            <Link href="/jobs/new" className="font-medium text-sky-700 hover:underline dark:text-sky-400">
              Create the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm transition hover:border-sky-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-sky-900"
                >
                  <span className="font-medium text-zinc-900 dark:text-white">{job.title}</span>
                  <span className="text-xs text-zinc-500">
                    {job.status} · {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
