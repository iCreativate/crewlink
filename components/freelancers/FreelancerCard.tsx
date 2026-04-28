import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@prisma/client";

function isSvg(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg");
}

type UserSlice = {
  id: string;
  name: string | null;
  image: string | null;
  profile: Profile | null;
};

export function FreelancerCard({ user }: { user: UserSlice }) {
  const p = user.profile;
  const title = user.name ?? "Freelancer";
  const specs = p?.specializations ?? [];
  const gear = p?.gearTags ?? [];
  const showSpecs = specs.slice(0, 3);
  const moreSpecs = specs.length - showSpecs.length;

  return (
    <Link
      href={`/profile/${user.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-sky-900"
    >
      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-zinc-100 via-zinc-50 to-sky-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-sky-950/40">
        {user.image ? (
          isSvg(user.image) ? (
            <img
              src={user.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <Image
              src={user.image}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width:640px) 100vw, 33vw"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-light text-zinc-300 dark:text-zinc-600">
            {(title[0] ?? "?").toUpperCase()}
          </div>
        )}
        {p?.availableNow ? (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Available
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold text-zinc-900 dark:text-white">{title}</p>
        {p?.headline ? <p className="mt-1 line-clamp-2 text-xs leading-snug text-zinc-600 dark:text-zinc-400">{p.headline}</p> : null}
        {p?.location ? <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">{p.location}</p> : null}
        {showSpecs.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {showSpecs.map((s) => (
              <span key={s} className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {s}
              </span>
            ))}
            {moreSpecs > 0 ? (
              <span className="rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800/80">+{moreSpecs}</span>
            ) : null}
          </div>
        ) : null}
        {gear.length > 0 ? (
          <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
            {gear.slice(0, 4).join(" · ")}
            {gear.length > 4 ? "…" : ""}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
