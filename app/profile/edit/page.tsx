import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { ProfileEditForm } from "@/components/ProfileEditForm";

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams?: { onboarding?: string };
}) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) redirect("/login?callbackUrl=/profile/edit");

  const user = await prisma.user.findUnique({
    where: { id: ctx.appUser.id },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  const p = user.profile;
  const isFreelancer = user.role === "FREELANCER";
  const showOnboarding = searchParams?.onboarding === "1";

  const missing: string[] = [];
  if (isFreelancer) {
    if (!user.name?.trim()) missing.push("Missing user.name");
    if (!p) missing.push("Missing profile");
    if (!p?.location?.trim()) missing.push("Missing profile.location");
    if (!p?.headline?.trim()) missing.push("Missing profile.headline");
    if (!p || !Array.isArray(p.specializations) || p.specializations.length === 0) {
      missing.push("No profile.specialization");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {showOnboarding && missing.length > 0 ? (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Finish setting up your profile</p>
          <p className="mt-1 text-amber-800 dark:text-amber-200">
            Your profile is missing a few required fields so producers can find and book you.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ProfileEditForm
        initial={{
          role: user.role,
          name: user.name,
          image: user.image,
          headline: p?.headline ?? null,
          bio: p?.bio ?? null,
          location: p?.location ?? null,
          website: p?.website ?? null,
          companyName: p?.companyName ?? null,
          specializations: p?.specializations ?? [],
          gearTags: p?.gearTags ?? [],
          availableNow: p?.availableNow ?? false,
        }}
      />
    </div>
  );
}
