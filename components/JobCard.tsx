"use client";

import Image from "next/image";
import Link from "next/link";
import { JobAcceptButton } from "@/components/JobAcceptButton";
import { JobApplyButton } from "@/components/JobApplyButton";
import { ApproxMoney } from "@/components/currency/ApproxMoney";
import { formatZar } from "@/lib/currency";

function isSvg(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg");
}

export type JobCardJob = {
  id: string;
  title: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  location: string | null;
  startsAt: string | null;
  payRate: string | null;
  gearRequirements: string[];
  status: string;
  createdAt: string;
  invitedFreelancerId?: string | null;
  crewRoleLabel?: string | null;
  emergencyMode?: boolean;
  poster: {
    id: string;
    name: string | null;
    role: string;
    image: string | null;
  };
};

function formatBudget(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${formatZar(min)} – ${formatZar(max)}`;
  if (min != null) return `From ${formatZar(min)}`;
  return `Up to ${formatZar(max!)}`;
}

type Props = {
  job: JobCardJob;
  showAccept?: boolean;
  currentUserId?: string | null;
  onJobFilled?: (jobId: string) => void;
};

export function JobCard({ job, showAccept, currentUserId, onJobFilled }: Props) {
  const excerpt =
    job.description.length > 180 ? `${job.description.slice(0, 180).trim()}…` : job.description;
  const budgetLabel = formatBudget(job.budgetMin, job.budgetMax);
  const budgetMidpointZar =
    job.budgetMin != null && job.budgetMax != null
      ? (job.budgetMin + job.budgetMax) / 2
      : job.budgetMin != null
        ? job.budgetMin
        : job.budgetMax != null
          ? job.budgetMax
          : null;
  const when = job.startsAt
    ? new Date(job.startsAt).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const inviteOk = !job.invitedFreelancerId || job.invitedFreelancerId === currentUserId;
  const canAccept =
    showAccept &&
    job.status === "OPEN" &&
    currentUserId &&
    job.poster.id !== currentUserId &&
    inviteOk;

  const urgent = job.emergencyMode === true;
  const isDirectOffer = Boolean(job.invitedFreelancerId && job.invitedFreelancerId === currentUserId);
  const canInstantAccept = urgent || isDirectOffer;

  return (
    <article
      className={[
        "group relative rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-zinc-950",
        urgent
          ? "border-red-400/90 ring-2 ring-red-500/25 hover:border-red-500 dark:border-red-800 dark:ring-red-500/20"
          : "border-zinc-200 hover:border-sky-200 dark:border-zinc-800 dark:hover:border-sky-900",
      ].join(" ")}
    >
      <Link
        href={`/jobs/${job.id}`}
        aria-label={`Open job: ${job.title}`}
        className="absolute inset-0 z-0 rounded-2xl"
      />
      {urgent ? (
        <p className="relative z-10 mb-3 rounded-lg bg-red-600 px-3 py-2 text-center text-xs font-bold uppercase tracking-widest text-white dark:bg-red-700">
          URGENT JOB - ACCEPT NOW
        </p>
      ) : null}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/jobs/${job.id}`}
            className="text-lg font-semibold text-zinc-900 group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300"
          >
            {job.title}
          </Link>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-2">
              {job.poster.image ? (
                <span className="relative inline-block h-6 w-6 overflow-hidden rounded-full bg-zinc-100 align-middle dark:bg-zinc-900">
                  {isSvg(job.poster.image) ? (
                    <img src={job.poster.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Image src={job.poster.image} alt="" fill className="object-cover" sizes="24px" />
                  )}
                </span>
              ) : null}
              <span>{job.poster.name ?? "Media house"}</span>
            </span>{" "}
            ·{" "}
            <Link href={`/profile/${job.poster.id}`} className="hover:text-sky-600 dark:hover:text-sky-400">
              Profile
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {job.crewRoleLabel ? (
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-950 dark:text-violet-200">
              {job.crewRoleLabel}
            </span>
          ) : null}
          {job.invitedFreelancerId && currentUserId && job.invitedFreelancerId === currentUserId ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Direct offer
            </span>
          ) : null}
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {job.status}
          </span>
        </div>
      </div>

      {excerpt ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{excerpt}</p>
      ) : null}

      <div className="relative z-10 mt-4 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        {when ? (
          <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium dark:bg-zinc-800 dark:text-zinc-300">{when}</span>
        ) : null}
        {job.location ? (
          <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800 dark:text-zinc-300">{job.location}</span>
        ) : null}
        {job.payRate ? (
          <span className="rounded-md bg-sky-50 px-2 py-1 font-medium text-sky-900 dark:bg-sky-950 dark:text-sky-200">
            {job.payRate}
          </span>
        ) : null}
        {budgetLabel ? <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">{budgetLabel}</span> : null}
        {budgetMidpointZar != null ? <ApproxMoney amountZar={budgetMidpointZar} /> : null}
      </div>

      {job.gearRequirements?.length ? (
        <div className="relative z-10 mt-3 flex flex-wrap gap-1">
          {job.gearRequirements.slice(0, 6).map((g) => (
            <span key={g} className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              {g}
            </span>
          ))}
          {job.gearRequirements.length > 6 ? (
            <span className="text-[10px] text-zinc-400">+{job.gearRequirements.length - 6}</span>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="text-[11px] text-zinc-400">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
          >
            Details
          </Link>
          {canAccept ? (
            canInstantAccept ? (
              <JobAcceptButton jobId={job.id} compact label="Accept" pendingLabel="Accepting…" onAccepted={() => onJobFilled?.(job.id)} />
            ) : (
              <JobApplyButton jobId={job.id} compact onApplied={() => {}} />
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
