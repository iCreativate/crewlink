import Image from "next/image";
import Link from "next/link";
import type { RankedFreelancerMatch } from "@/lib/job-matching";

type Props = {
  matches: RankedFreelancerMatch[];
};

export function SuggestedCrew({ matches }: Props) {
  if (matches.length === 0) {
    return (
      <section className="mt-12 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-8 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Suggested crew</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          No freelancers with profiles yet. As people add gear tags, locations, and availability, matches will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Suggested crew</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Ranked by gear overlap, availability, and location text match. Invite people to apply or reach out directly.
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {matches.map((m, i) => {
          const { user, profile, breakdown } = m;
          const title = user.name ?? "Freelancer";
          return (
            <li
              key={user.id}
              className="flex flex-wrap items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex shrink-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {user.image ? (
                    <Image src={user.image} alt="" fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-medium text-zinc-400">
                      {(title[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/profile/${user.id}`} className="font-semibold text-zinc-900 hover:text-sky-700 dark:text-white dark:hover:text-sky-300">
                    {title}
                  </Link>
                  {profile.availableNow ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Available
                    </span>
                  ) : null}
                </div>
                {profile.headline ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{profile.headline}</p>
                ) : null}
                {profile.location ? <p className="mt-1 text-xs text-zinc-500">{profile.location}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                    Gear match +{breakdown.gearScore}
                  </span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                    Location +{breakdown.locationScore}
                  </span>
                  {breakdown.availabilityScore > 0 ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                      Availability +{breakdown.availabilityScore}
                    </span>
                  ) : (
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">Availability +0</span>
                  )}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Score {breakdown.total}</span>
                </div>
                {breakdown.matchedGear.length > 0 ? (
                  <p className="mt-2 text-[11px] text-sky-700 dark:text-sky-400">
                    Matched gear: {breakdown.matchedGear.join(", ")}
                  </p>
                ) : null}
                {profile.specializations.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {profile.specializations.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] dark:border-zinc-700">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <Link
                href={`/profile/${user.id}`}
                className="shrink-0 self-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                View profile
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
