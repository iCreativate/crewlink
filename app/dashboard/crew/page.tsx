import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { listCrewTemplatesForOwner } from "@/api/crew-templates";

export default async function CrewBuilderListPage() {
  const { appUser } = await requireRole("MEDIA_HOUSE", "/dashboard/feed");
  const templates = await listCrewTemplatesForOwner(appUser.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Crew builder</h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Save reusable crew lineups with roles and go-to freelancers. Book the whole template in one step — each role
            becomes its own job listing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/crew/new"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            New template
          </Link>
          <Link
            href="/dashboard/jobs"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Job dashboard
          </Link>
        </div>
      </div>

      <section className="mt-10">
        {templates.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
            No crew templates yet.{" "}
            <Link href="/dashboard/crew/new" className="font-medium text-sky-700 hover:underline dark:text-sky-400">
              Create your first template
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {templates.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/crew/${t.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-4 transition hover:border-sky-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-sky-900"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{t.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {t.roles.length} role{t.roles.length === 1 ? "" : "s"} · Updated {new Date(t.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-sky-700 dark:text-sky-400">Edit / book →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
