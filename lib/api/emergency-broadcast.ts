import type { Job } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scoreLocationProximity } from "@/lib/job-matching";
import { emitJobEmergencyToUsers, emitToJobsRoom } from "@/lib/socket-global";

const MAX_RECIPIENTS = 120;
const STRONG_MATCH = 14;

/**
 * Freelancers to notify for an urgent job, using the same text-based location overlap as job matching
 * (no geocoding). If the job has no location, prefers freelancers marked available now.
 */
export async function getNearbyFreelancerUserIdsForEmergency(
  job: Pick<Job, "location" | "gearRequirements">,
): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { role: "FREELANCER", profile: { isNot: null } },
    select: {
      id: true,
      profile: { select: { location: true, availableNow: true } },
    },
  });

  const scored = users.map((u) => {
    const locScore = scoreLocationProximity(job.location, u.profile?.location ?? null);
    return {
      id: u.id,
      locScore,
      availableNow: u.profile?.availableNow ?? false,
    };
  });

  const hasJobLocation = Boolean(job.location?.trim());

  let picked: typeof scored;
  if (hasJobLocation) {
    picked = scored.filter(
      (s) => s.locScore >= STRONG_MATCH || (s.availableNow && s.locScore >= 8) || s.locScore >= 10,
    );
    picked.sort((a, b) => b.locScore - a.locScore || Number(b.availableNow) - Number(a.availableNow));
    if (picked.length === 0) {
      picked = [...scored].sort((a, b) => b.locScore - a.locScore).slice(0, 40);
    }
  } else {
    picked = [...scored].sort((a, b) => Number(b.availableNow) - Number(a.availableNow) || b.locScore - a.locScore);
  }

  return picked.slice(0, MAX_RECIPIENTS).map((s) => s.id);
}

export function emitEmergencyJobToNearbyFreelancers(job: Record<string, unknown>, targetUserIds: string[]) {
  emitJobEmergencyToUsers(targetUserIds, { job });
  emitToJobsRoom("job:patch", { jobId: job.id, emergencyMode: true });
}
