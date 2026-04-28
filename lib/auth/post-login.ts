export type AppRole = "FREELANCER" | "MEDIA_HOUSE";

export function postLoginPathForRole(role: AppRole): string {
  return role === "MEDIA_HOUSE" ? "/dashboard/jobs" : "/dashboard/feed";
}
