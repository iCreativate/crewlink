import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeaturedOpportunity } from "@/lib/opportunities";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = getFeaturedOpportunity(id);
  if (!opp) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="meta-text">
        <Link href="/feed" className="hover:underline">
          ← Back to feed
        </Link>
      </p>

      <div className="mt-4 sidebar-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Featured opportunity</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">{opp.title}</h1>
        <p className="meta-text mt-2">{opp.meta}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Location", value: opp.location },
            { label: "Duration", value: opp.duration },
            { label: "Pay", value: opp.pay },
          ].map((it) => (
            <div key={it.label} className="surface-soft p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{it.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{it.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-white">Details</p>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.65] text-slate-200">{opp.description}</p>
        </div>

        {opp.requirements?.length ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-white">Requirements</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
              {opp.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/jobs" className="primary-button">
            View similar jobs
          </Link>
          <Link href="/feed" className="pill-button">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

