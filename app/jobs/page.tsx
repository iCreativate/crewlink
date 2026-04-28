import Link from "next/link";
import { getAuthContext } from "@/lib/auth/server";
import { JobFeed } from "@/components/JobFeed";

export default async function JobsPage() {
  const ctx = await getAuthContext();
  const canPost = ctx?.appUser?.role === "MEDIA_HOUSE";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Jobs</h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Open production roles from verified media houses. This feed refreshes automatically.
          </p>
        </div>
        {canPost ? (
          <Link
            href="/jobs/new"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Post a job
          </Link>
        ) : null}
      </div>
      <div className="mt-10">
        <JobFeed />
      </div>
    </div>
  );
}
