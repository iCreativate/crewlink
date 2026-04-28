import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { CrewTemplateEditor } from "@/components/CrewTemplateEditor";

export default async function NewCrewTemplatePage() {
  await requireRole("MEDIA_HOUSE", "/dashboard/feed");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm text-zinc-500">
        <Link href="/dashboard/crew" className="hover:text-sky-600 dark:hover:text-sky-400">
          ← Crew templates
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-white">New crew template</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Add the roles you usually staff. You can assign specific freelancers or leave slots open for the job board.
      </p>
      <div className="mt-10">
        <CrewTemplateEditor />
      </div>
    </div>
  );
}
