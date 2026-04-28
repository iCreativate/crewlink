import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

function hintForDashboardProfileError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("Environment variable not found: DATABASE_URL")) {
    return "Missing DATABASE_URL in Vercel. Set DATABASE_URL (pooler) and DIRECT_URL (direct), then redeploy.";
  }
  if (message.includes("Can't reach database server")) {
    return "Database network issue. In Vercel, DATABASE_URL must be the Supabase pooler (port 6543) and include sslmode=require.";
  }
  if (message.includes("Authentication failed against database server")) {
    return "Database auth failed. Re-copy the Supabase pooler connection string (pooler username is not plain 'postgres') and redeploy.";
  }
  if (message.includes("does not exist in the current database") || message.includes("P2021") || message.includes("P2022")) {
    return "Database schema mismatch. Re-run Prisma migrations against the same Supabase project using DIRECT_URL (5432).";
  }

  return "Open Vercel logs for this request and search for [dashboard/feed/layout] to see the underlying error.";
}

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
    const hint = hintForDashboardProfileError(err);
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Dashboard couldn’t load</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          The server couldn’t load your profile data. This is usually a database connection or migration issue.
        </p>
        <p className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200">
          <span className="font-semibold">Most likely:</span> {hint}
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
