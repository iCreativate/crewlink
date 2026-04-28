import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

export default async function FreelancerFeedLayout({ children }: { children: React.ReactNode }) {
  const { appUser } = await requireRole("FREELANCER", "/dashboard/jobs");

  let user: Prisma.UserGetPayload<{ include: { profile: true } }> | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: appUser.id },
      include: { profile: true },
    });
  } catch (err) {
    console.error("[dashboard/feed/layout] failed to load user profile", err);
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Dashboard couldn’t load</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          The server couldn’t load your profile data. This is usually a database connection or migration issue.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Confirm Vercel env vars <code>DATABASE_URL</code> (pooler) and <code>DIRECT_URL</code> (direct) are set.</li>
          <li>Confirm Prisma migrations were applied to the same Supabase project.</li>
          <li>Check Vercel Function logs for <code>[dashboard/feed/layout]</code> and Prisma errors.</li>
        </ul>
      </div>
    );
  }
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
