"use client";

import { useRouter } from "next/navigation";
import { JobAcceptButton } from "@/components/JobAcceptButton";
import { JobApplyButton } from "@/components/JobApplyButton";

type Props = {
  jobId: string;
  status: string;
  posterId: string;
  viewerRole: string | null;
  viewerId: string | null;
  invitedFreelancerId?: string | null;
  alreadyApplied?: boolean;
};

export function JobAcceptSection({
  jobId,
  status,
  posterId,
  viewerRole,
  viewerId,
  invitedFreelancerId,
  alreadyApplied,
}: Props) {
  const router = useRouter();

  if (status !== "OPEN" || viewerRole !== "FREELANCER" || !viewerId || viewerId === posterId) {
    return null;
  }

  if (invitedFreelancerId && invitedFreelancerId !== viewerId) {
    return null;
  }

  const offeredToViewer = Boolean(invitedFreelancerId && invitedFreelancerId === viewerId);

  return (
    <div className="mt-8 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Take this gig</p>
      <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-200/80">
        {offeredToViewer
          ? "You’ve received an offer. Accept to lock it in."
          : alreadyApplied
            ? "Application sent. If the poster approves you, you’ll receive an offer to accept."
            : "Apply with a short proposal so the media house can review your fit."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {offeredToViewer ? (
          <JobAcceptButton jobId={jobId} label="Accept offer" pendingLabel="Accepting…" onAccepted={() => router.refresh()} />
        ) : alreadyApplied ? null : (
          <JobApplyButton jobId={jobId} onApplied={() => router.refresh()} />
        )}
      </div>
    </div>
  );
}
