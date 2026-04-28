import Link from "next/link";
import { notFound } from "next/navigation";
import { getCrewTemplateForOwner } from "@/api/crew-templates";
import { BookCrewFromTemplateForm } from "@/components/BookCrewFromTemplateForm";
import { CrewTemplateEditor, type CrewTemplateInitial } from "@/components/CrewTemplateEditor";
import { DeleteCrewTemplateButton } from "@/components/DeleteCrewTemplateButton";
import { requireRole } from "@/lib/auth/server";

export default async function CrewTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { appUser } = await requireRole("MEDIA_HOUSE", "/dashboard/feed");
  const t = await getCrewTemplateForOwner(id, appUser.id);
  if (!t) notFound();

  const initial: CrewTemplateInitial = {
    name: t.name,
    description: t.description,
    roles: t.roles.map((r) => ({
      roleName: r.roleName,
      assignedFreelancerId: r.assignedFreelancerId,
      assignedFreelancer: r.assignedFreelancer,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm text-zinc-500">
        <Link href="/dashboard/crew" className="hover:text-sky-600 dark:hover:text-sky-400">
          ← Crew templates
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t.name}</h1>
        <DeleteCrewTemplateButton templateId={id} />
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Update roles and assignments anytime. Booking creates one job per role with shared gig details.
      </p>

      <div className="mt-10 space-y-10">
        <CrewTemplateEditor templateId={id} initial={initial} />
        <BookCrewFromTemplateForm templateId={id} />
      </div>
    </div>
  );
}
