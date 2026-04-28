import { prisma } from "@/lib/prisma";
import { compareMatches, scoreFreelancerForJob, type RankedFreelancerMatch } from "@/lib/job-matching";

export async function getRankedMatchesForJob(jobId: string, limit = 24): Promise<RankedFreelancerMatch[]> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, location: true, gearRequirements: true, posterId: true },
  });
  if (!job) return [];

  const freelancers = await prisma.user.findMany({
    where: {
      role: "FREELANCER",
      profile: { isNot: null },
    },
    include: { profile: true },
  });

  const ranked: RankedFreelancerMatch[] = [];

  for (const user of freelancers) {
    const profile = user.profile;
    if (!profile) continue;

    const breakdown = scoreFreelancerForJob(job, profile);
    ranked.push({
      user: { id: user.id, name: user.name, image: user.image },
      profile,
      breakdown,
    });
  }

  ranked.sort(compareMatches);
  return ranked.slice(0, limit);
}
