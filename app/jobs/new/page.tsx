import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/server";
import { PostJobForm } from "@/components/PostJobForm";

export default async function NewJobPage() {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) redirect("/login?callbackUrl=/jobs/new");
  if (ctx.appUser.role !== "MEDIA_HOUSE") redirect("/dashboard/jobs");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PostJobForm />
    </div>
  );
}
