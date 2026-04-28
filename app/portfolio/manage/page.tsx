import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { listPortfolioForUser } from "@/api/portfolio";
import { PortfolioManageForm } from "@/components/PortfolioManageForm";
import { PortfolioDeleteButton } from "@/components/PortfolioDeleteButton";

export default async function PortfolioManagePage() {
  const { appUser } = await requireRole("FREELANCER", "/dashboard/jobs");
  const items = await listPortfolioForUser(appUser.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Manage portfolio</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Upload media; files are stored under <code className="text-xs">public/uploads</code> (use object storage in
            production).
          </p>
        </div>
        <Link href="/portfolio" className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400">
          View public feed
        </Link>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <PortfolioManageForm />
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Your pieces</h2>
          <ul className="mt-4 space-y-4">
            {items.length === 0 ? (
              <li className="text-sm text-zinc-500 dark:text-zinc-400">Nothing uploaded yet.</li>
            ) : (
              items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-1 top-1 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur hover:bg-black/70"
                    >
                      Open
                    </a>
                    {item.mediaType === "VIDEO" ? (
                      <video src={item.url} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <a href={item.url} target="_blank" rel="noreferrer" className="absolute inset-0">
                        <Image src={item.url} alt="" fill className="object-cover" sizes="112px" />
                      </a>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                      {item.title || "Untitled"}
                    </p>
                    <p className="text-xs text-zinc-500">{item.mediaType}</p>
                    <div className="mt-2">
                      <PortfolioDeleteButton id={item.id} />
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
