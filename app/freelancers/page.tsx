import { Suspense } from "react";

export const dynamic = "force-dynamic";
import { FreelancerCard } from "@/components/freelancers/FreelancerCard";
import { FreelancerFilters } from "@/components/freelancers/FreelancerFilters";
import { distinctGearTagsForFilters, listFreelancers } from "@/api/freelancers";

function parseCsv(param: string | undefined): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function FreelancersResults({
  searchParams,
}: {
  searchParams: Promise<{ spec?: string; gear?: string; available?: string }>;
}) {
  const sp = await searchParams;
  const freelancers = await listFreelancers(
    {
      specializations: parseCsv(sp.spec),
      gearTags: parseCsv(sp.gear),
      availableOnly: sp.available === "1",
    },
    72,
  );

  if (freelancers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/80 px-8 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">No freelancers match these filters.</p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Try fewer tags or clear filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {freelancers.map((u) => (
        <FreelancerCard key={u.id} user={u} />
      ))}
    </div>
  );
}

export default async function FreelancersPage({
  searchParams,
}: {
  searchParams: Promise<{ spec?: string; gear?: string; available?: string }>;
}) {
  let popularGear: string[] = [];
  try {
    popularGear = await distinctGearTagsForFilters(50);
  } catch {
    popularGear = [];
  }

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Discover</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">Freelancers</h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Filter by craft and gear. Profiles are built for quick scanning — like a call sheet meets a creative portfolio.
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[280px_1fr] lg:items-start">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-900" />}>
            <FreelancerFilters popularGear={popularGear} />
          </Suspense>

          <Suspense
            fallback={
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
                ))}
              </div>
            }
          >
            <FreelancersResults searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
