import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth/server";
import { NotificationsList } from "@/components/NotificationsList";

export default async function NotificationsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) redirect("/login?callbackUrl=/dashboard/notifications");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Notifications</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Offers, messages, and important updates.</p>
        </div>
        <Link href="/feed" className="pill-button px-4 py-2 text-sm">
          Back to feed
        </Link>
      </div>

      <section className="mt-8">
        <NotificationsList />
      </section>
    </div>
  );
}

