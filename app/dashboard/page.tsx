import { redirect } from "next/navigation";
import { getAuthContext, postLoginPathForRole } from "@/lib/auth/server";

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?callbackUrl=/dashboard");

  redirect(postLoginPathForRole(ctx.appUser.role));
}
