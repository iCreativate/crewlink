import Link from "next/link";
import { getAuthContext } from "@/lib/auth/server";
import { SignOutButton } from "@/components/SignOutButton";

export async function SiteHeader() {
  const ctx = await getAuthContext();
  const user = ctx?.appUser;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          Crew<span className="text-sky-600 dark:text-sky-400">Link</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
          <Link className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" href="/jobs">
            Jobs
          </Link>
          <Link className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" href="/freelancers">
            Freelancers
          </Link>
          {user ? (
            <>
              <Link className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" href="/feed">
                Feed
              </Link>
              <Link
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="hidden text-zinc-600 hover:text-zinc-900 sm:inline dark:text-zinc-400 dark:hover:text-white"
                href={`/profile/${user.id}`}
              >
                Profile
              </Link>
              <span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">
                {user.role === "MEDIA_HOUSE" ? "Media house" : "Freelancer"}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                href="/register"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
