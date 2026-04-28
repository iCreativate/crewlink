import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function FreelancerFeedLayout({ children }: { children: React.ReactNode }) {
  const { appUser } = await requireRole("FREELANCER", "/dashboard/jobs");

  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    include: { profile: true },
  });
  if (!user) redirect("/login?callbackUrl=/dashboard/feed");

  const p = user.profile;
  const needsProfileSetup =
    !user.name?.trim() ||
    !p ||
    !p.location?.trim() ||
    !p.headline?.trim() ||
    !Array.isArray(p.specializations) ||
    p.specializations.length === 0;

  if (needsProfileSetup) {
    redirect("/profile/edit?onboarding=1");
  }
  return children;
}
