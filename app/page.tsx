import Link from "next/link";
import { getAuthContext } from "@/lib/auth/server";

export default async function Home() {
  const ctx = await getAuthContext();

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/media-event.svg')] bg-cover bg-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/85 via-white/80 to-zinc-50 dark:from-zinc-950/85 dark:via-zinc-950/75 dark:to-zinc-950"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
          Production crews, meet production partners
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
          Hire talent and book jobs with{" "}
          <span className="text-sky-600 dark:text-sky-400">CrewLink</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Freelancers showcase reels and stills; media houses post roles with budgets and locations. Real-time job
          updates keep everyone aligned.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/jobs"
            className="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            Browse jobs
          </Link>
          {!ctx?.appUser ? (
            <Link
              href="/register"
              className="rounded-full border border-transparent px-6 py-3 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
            >
              Create account
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="rounded-full border border-transparent px-6 py-3 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
            >
              Open dashboard
            </Link>
          )}
        </div>
      </div>
      <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3">
        {[
          {
            title: "Two roles, one platform",
            body: "Freelancers and media houses each get flows tailored to hiring or getting hired.",
          },
          {
            title: "Live job stream",
            body: "Server-sent events plus SWR keep listings fresh without manual refresh.",
          },
          {
            title: "Portfolio uploads",
            body: "Images and short video live under your profile with size-checked API uploads.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{card.body}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
