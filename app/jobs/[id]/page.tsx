import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth/server";
import { getRankedMatchesForJob } from "@/api/job-matching";
import { getJobById } from "@/api/jobs";
import { ActivateEmergencyModeButton } from "@/components/ActivateEmergencyModeButton";
import { JobStatusControls } from "@/components/JobStatusControls";
import { JobAcceptSection } from "@/components/JobDetailActions";
import { SuggestedCrew } from "@/components/SuggestedCrew";
import { JobApplicationsPanel } from "@/components/JobApplicationsPanel";
import { JobChatPanel } from "@/components/JobChatPanel";
import { prisma } from "@/lib/prisma";
import { ApproxMoney } from "@/components/currency/ApproxMoney";
import { formatZar } from "@/lib/currency";

function isSvg(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg");
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const ctx = await getAuthContext();
  const isOwner = ctx?.appUser?.id === job.posterId;
  const viewerId = ctx?.appUser?.id ?? null;
  const alreadyApplied =
    viewerId && ctx?.appUser?.role === "FREELANCER" && viewerId !== job.posterId
      ? Boolean(await prisma.jobApplication.findUnique({ where: { jobId_userId: { jobId: job.id, userId: viewerId } }, select: { id: true } }))
      : false;

  const suggestedCrew =
    isOwner && ctx?.appUser?.role === "MEDIA_HOUSE" ? await getRankedMatchesForJob(job.id, 30) : [];

  const when = job.startsAt
    ? new Date(job.startsAt).toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm text-zinc-500">
        <Link href="/jobs" className="hover:text-sky-600 dark:hover:text-sky-400">
          ← All jobs
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{job.title}</h1>

      {job.emergencyMode && job.status === "OPEN" ? (
        <div className="mt-4 rounded-xl border border-red-500 bg-red-600 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-white dark:bg-red-700">
          URGENT JOB - ACCEPT NOW
        </div>
      ) : null}

      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Posted by{" "}
        <Link
          href={`/profile/${job.poster.id}`}
          className="inline-flex items-center gap-2 font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          {job.poster.image ? (
            <span className="relative inline-block h-7 w-7 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              {isSvg(job.poster.image) ? (
                <img src={job.poster.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Image src={job.poster.image} alt="" fill className="object-cover" sizes="28px" />
              )}
            </span>
          ) : null}
          {job.poster.name ?? "Media house"}
        </Link>{" "}
        · <span className="font-medium">{job.status}</span>
      </p>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {job.crewRoleLabel ? (
          <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-900 dark:bg-violet-950 dark:text-violet-100">
            Role: {job.crewRoleLabel}
          </span>
        ) : null}
        {job.invitedFreelancerId && ctx?.appUser?.id === job.invitedFreelancerId ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100">
            Offered to you
          </span>
        ) : null}
        {when ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{when}</span>
        ) : null}
        {job.location ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{job.location}</span>
        ) : null}
        {job.payRate ? (
          <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-900 dark:bg-sky-950 dark:text-sky-100">
            {job.payRate}
          </span>
        ) : null}
      </div>

      {job.gearRequirements.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Gear requirements</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {job.gearRequirements.map((g) => (
              <span
                key={g}
                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {job.budgetMin != null || job.budgetMax != null ? (
        <p className="mt-6 text-sm text-zinc-700 dark:text-zinc-300">
          Budget range:{" "}
          {job.budgetMin != null && job.budgetMax != null
            ? `${formatZar(job.budgetMin)} – ${formatZar(job.budgetMax)}`
            : job.budgetMin != null
              ? `From ${formatZar(job.budgetMin)}`
              : `Up to ${formatZar(job.budgetMax!)}`}
          {job.budgetMin != null && job.budgetMax != null ? (
            <ApproxMoney amountZar={(job.budgetMin + job.budgetMax) / 2} />
          ) : job.budgetMin != null ? (
            <ApproxMoney amountZar={job.budgetMin} />
          ) : job.budgetMax != null ? (
            <ApproxMoney amountZar={job.budgetMax} />
          ) : null}
        </p>
      ) : null}

      <article className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
          {job.description || "No additional notes."}
        </p>
      </article>

      {job.status === "FILLED" && job.acceptedBy ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          {job.acceptedBy.image ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
              <Image src={job.acceptedBy.image} alt="" fill className="object-cover" sizes="48px" />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {(job.acceptedBy.name ?? "?")[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Filled</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {job.acceptedBy.name ?? "Freelancer"}{" "}
              <Link href={`/profile/${job.acceptedBy.id}`} className="text-sky-700 hover:underline dark:text-sky-400">
                View profile
              </Link>
            </p>
            {job.acceptedAt ? (
              <p className="text-xs text-zinc-500">{new Date(job.acceptedAt).toLocaleString()}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <JobAcceptSection
        jobId={job.id}
        status={job.status}
        posterId={job.posterId}
        viewerRole={ctx?.appUser?.role ?? null}
        viewerId={viewerId}
        invitedFreelancerId={job.invitedFreelancerId}
        alreadyApplied={alreadyApplied}
      />

      {viewerId ? <JobChatPanel jobId={job.id} viewerId={viewerId} /> : null}

      {isOwner && ctx?.appUser?.role === "MEDIA_HOUSE" ? <JobApplicationsPanel jobId={job.id} /> : null}

      {isOwner && ctx?.appUser?.role === "MEDIA_HOUSE" && job.status === "OPEN" && !job.invitedFreelancerId ? (
        <div className="mt-8">
          <ActivateEmergencyModeButton jobId={job.id} alreadyActive={job.emergencyMode} />
        </div>
      ) : null}

      {isOwner && ctx?.appUser?.role === "MEDIA_HOUSE" ? <SuggestedCrew matches={suggestedCrew} /> : null}

      {isOwner ? (
        <div className="mt-10">
          <JobStatusControls jobId={job.id} current={job.status} />
        </div>
      ) : null}
    </div>
  );
}
