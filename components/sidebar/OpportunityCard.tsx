import Link from "next/link";

export function OpportunityCard({ title, meta, href = "/jobs" }: { title: string; meta: string; href?: string }) {
  return (
    <Link href={href} className="surface-soft block p-4 transition hover:bg-white/10">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="meta-text mt-1">{meta}</p>
      <span className="primary-button mt-3 inline-block">View details</span>
    </Link>
  );
}
