import { requireRole } from "@/lib/auth/server";

export default async function MediaJobDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole("MEDIA_HOUSE", "/dashboard/feed");
  return children;
}
