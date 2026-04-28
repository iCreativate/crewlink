import Link from "next/link";
import { getAuthContext } from "@/lib/auth/server";
import { SignOutButton } from "@/components/SignOutButton";
import { CurrencyPicker } from "@/components/currency/CurrencyPicker";

export async function TopNav() {
  const ctx = await getAuthContext();
  const user = ctx?.appUser;

  return (
    <header className="navbar sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Crew<span className="text-sky-400">Link</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
          <Link className="text-slate-300 hover:text-white" href="/jobs">
            Jobs
          </Link>
          <Link className="text-slate-300 hover:text-white" href="/freelancers">
            Freelancers
          </Link>
          {user ? (
            <>
              <Link className="text-slate-300 hover:text-white" href="/feed">
                Feed
              </Link>
              <Link className="text-slate-300 hover:text-white" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-slate-300 hover:text-white" href="/dashboard/notifications">
                Notifications
              </Link>
              <Link className="hidden text-slate-300 hover:text-white sm:inline" href={`/profile/${user.id}`}>
                Profile
              </Link>
              <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300 sm:inline">
                {user.role === "MEDIA_HOUSE" ? "Media house" : "Freelancer"}
              </span>
              <CurrencyPicker />
              <SignOutButton />
            </>
          ) : (
            <>
              <Link className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100" href="/login">
                Sign in
              </Link>
              <Link className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-white/5" href="/register">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

