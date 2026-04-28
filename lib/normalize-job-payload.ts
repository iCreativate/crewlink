import type { JobCardJob } from "@/components/JobCard";

/** Normalize API / socket job JSON for client components. */
export function normalizeJobPayload(j: Record<string, unknown>): JobCardJob {
  const startsAt = j.startsAt;
  return {
    ...j,
    invitedFreelancerId: typeof j.invitedFreelancerId === "string" ? j.invitedFreelancerId : null,
    crewRoleLabel: typeof j.crewRoleLabel === "string" ? j.crewRoleLabel : null,
    emergencyMode: j.emergencyMode === true,
    description: typeof j.description === "string" ? j.description : "",
    gearRequirements: Array.isArray(j.gearRequirements) ? (j.gearRequirements as string[]) : [],
    payRate: typeof j.payRate === "string" ? j.payRate : null,
    startsAt:
      startsAt == null
        ? null
        : typeof startsAt === "string"
          ? startsAt
          : new Date(startsAt as string).toISOString(),
    createdAt:
      typeof j.createdAt === "string" ? j.createdAt : new Date(j.createdAt as string).toISOString(),
  } as JobCardJob;
}
