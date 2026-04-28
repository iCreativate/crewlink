import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth/server";
import { getPublicProfile } from "@/api/profile";
import { prisma } from "@/lib/prisma";
import { FollowButton } from "@/components/FollowButton";

function isSvg(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg");
}

type ActivityAuthor = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  profile?: { headline: string | null; specializations: string[] };
};

type ActivityPost = {
  id: string;
  body: string;
  mediaType: "IMAGE" | "VIDEO" | null;
  mediaUrl: string | null;
  collab: boolean;
  collabNote: string | null;
  createdAt: Date;
  _count: { likes: number; shares: number };
  sharedPost: (ActivityPost & { author?: ActivityAuthor }) | null;
};

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getPublicProfile(userId);
  if (!user) notFound();

  const ctx = await getAuthContext();
  const isSelf = ctx?.appUser?.id === user.id;
  const viewerId = ctx?.appUser?.id ?? null;
  const initialFollowing =
    viewerId && !isSelf
      ? Boolean(
          await prisma.userFollow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
            select: { id: true },
          }),
        )
      : false;

  const isFreelancer = user.role === "FREELANCER";
  const displayName = user.name ?? "Member";
  const p = user.profile;
  const joinLabel = new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short" });

  const activity = user.feedPosts as unknown as ActivityPost[] | undefined;

  const postedJobs = user.jobsPosted as
    | Array<{ id: string; title: string; location: string | null; payRate: string | null; status: string; createdAt: Date }>
    | undefined;

  if (isFreelancer) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="relative h-44 bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-violet-600/20 sm:h-52 dark:from-sky-900/30 dark:via-indigo-950/40 dark:to-violet-950/30" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="relative -mt-20 flex flex-col gap-6 sm:-mt-24 sm:flex-row sm:items-end sm:gap-8">
            <div className="relative mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-xl ring-1 ring-zinc-200/80 dark:border-zinc-950 dark:bg-zinc-800 dark:ring-zinc-800 sm:mx-0 sm:h-40 sm:w-40">
              {user.image ? (
                isSvg(user.image) ? (
                  <img src={user.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <Image src={user.image} alt="" fill className="object-cover" sizes="160px" priority />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-light text-zinc-400">
                  {(displayName[0] ?? "?").toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 pb-2 text-center sm:pb-4 sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">{displayName}</h1>
                {p?.availableNow ? (
                  <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Available now
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Booking
                  </span>
                )}
              </div>
              {p?.headline ? (
                <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">{p.headline}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500 dark:text-zinc-500 sm:justify-start">
                {p?.location ? <span>{p.location}</span> : null}
                {p?.website ? (
                  <a
                    href={p.website}
                    className="font-medium text-sky-700 hover:underline dark:text-sky-400"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Website
                  </a>
                ) : null}
                <span className="text-xs text-zinc-400">Joined {joinLabel}</span>
                <Link href="/freelancers" className="text-xs text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400">
                  ← Freelancers
                </Link>
              </div>
            </div>
            {isSelf ? (
              <Link
                href="/profile/edit"
                className="self-center rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:self-end"
              >
                Edit profile
              </Link>
            ) : viewerId ? (
              <div className="self-center sm:self-end">
                <FollowButton userId={user.id} initialFollowing={initialFollowing} size="md" />
              </div>
            ) : null}
          </div>

          {p?.specializations && p.specializations.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Specializations</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.specializations.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-800 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {p?.gearTags && p.gearTags.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Gear & tools</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.gearTags.map((g) => (
                  <span
                    key={g}
                    className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    #{g}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {p?.bio ? (
            <section className="mt-10 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">About</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{p.bio}</p>
            </section>
          ) : null}

          {activity && activity.length > 0 ? (
            <section className="mt-10">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Activity</h2>
                <Link href="/feed" className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400">
                  View on feed
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                {activity.slice(0, 6).map((post) => (
                  <article
                    key={post.id}
                    className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(post.createdAt).toLocaleString()}
                          {post.collab ? " · Open to collaborate" : ""}
                        </p>
                        {post.collabNote ? (
                          <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-200">{post.collabNote}</p>
                        ) : null}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        ♥ {post._count.likes.toLocaleString()} · ↻ {post._count.shares.toLocaleString()}
                      </div>
                    </div>
                    {post.body ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                        {post.body}
                      </p>
                    ) : null}
                    {post.mediaType && post.mediaUrl ? (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="relative aspect-video w-full">
                          {post.mediaType === "VIDEO" ? (
                            <video src={post.mediaUrl} className="h-full w-full object-cover" controls playsInline muted />
                          ) : isSvg(post.mediaUrl) ? (
                            <img src={post.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                          ) : (
                            <Image
                              src={post.mediaUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 768px"
                            />
                          )}
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section id="portfolio" className="mt-12 pb-16">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Portfolio</h2>
            {user.portfolioItems.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No portfolio items yet.</p>
            ) : (
              <div className="mt-6 columns-2 gap-3 sm:columns-3 sm:gap-4">
                {user.portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:mb-4"
                  >
                    <div className="relative aspect-[4/5] w-full bg-zinc-100 dark:bg-zinc-800">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur hover:bg-black/70"
                      >
                        Open reel
                      </a>
                      {item.mediaType === "VIDEO" ? (
                        <video
                          src={item.url}
                          className="h-full w-full cursor-pointer object-cover"
                          controls
                          playsInline
                          muted
                          onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                        />
                      ) : isSvg(item.url) ? (
                        <a href={item.url} target="_blank" rel="noreferrer" className="absolute inset-0">
                          <img src={item.url} alt={item.title || ""} className="h-full w-full object-cover" />
                        </a>
                      ) : (
                        <a href={item.url} target="_blank" rel="noreferrer" className="absolute inset-0">
                          <Image src={item.url} alt={item.title || ""} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" />
                        </a>
                      )}
                    </div>
                    {item.title ? (
                      <p className="px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">{item.title}</p>
                    ) : null}
                    {item.gearTags?.length ? (
                      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                        {item.gearTags.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  /* Media house — compact professional layout */
  const mediaTitle = p?.companyName || user.name || "Media house";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-zinc-200 dark:bg-zinc-800">
            {user.image ? (
              isSvg(user.image) ? (
                <img src={user.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Image src={user.image} alt="" fill className="object-cover" sizes="80px" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-500">
                {(mediaTitle[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">Media house</p>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{mediaTitle}</h1>
            {p?.headline ? <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{p.headline}</p> : null}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              {p?.location ? <span>{p.location}</span> : null}
              {p?.website ? (
                <a href={p.website} className="text-sky-700 hover:underline dark:text-sky-400" target="_blank" rel="noreferrer">
                  Website
                </a>
              ) : null}
              <span className="text-xs text-zinc-400">Joined {joinLabel}</span>
            </div>
          </div>
        </div>
        {isSelf ? (
          <Link
            href="/profile/edit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Edit profile
          </Link>
        ) : null}
      </div>
      {p?.bio ? (
        <p className="mt-8 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{p.bio}</p>
      ) : null}

      {postedJobs && postedJobs.length > 0 ? (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Recent job posts</h2>
            <Link href="/jobs" className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400">
              Browse jobs
            </Link>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {postedJobs.map((j) => (
              <li key={j.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <Link href={`/jobs/${j.id}`} className="font-semibold text-zinc-900 hover:text-sky-700 dark:text-white dark:hover:text-sky-300">
                  {j.title}
                </Link>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {j.location ? `${j.location} · ` : ""}
                  {j.payRate ?? "Rate TBD"} · {j.status}
                </p>
                <p className="mt-2 text-[11px] text-zinc-400">Posted {new Date(j.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activity && activity.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Activity</h2>
            <Link href="/feed" className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400">
              View on feed
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {activity.slice(0, 6).map((post) => (
              <article key={post.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(post.createdAt).toLocaleString()}</p>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    ♥ {post._count.likes.toLocaleString()} · ↻ {post._count.shares.toLocaleString()}
                  </div>
                </div>
                {post.body ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{post.body}</p>
                ) : null}
                {post.mediaType && post.mediaUrl ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="relative aspect-video w-full">
                      {post.mediaType === "VIDEO" ? (
                        <video src={post.mediaUrl} className="h-full w-full object-cover" controls playsInline muted />
                      ) : isSvg(post.mediaUrl) ? (
                        <img src={post.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <Image src={post.mediaUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section id="portfolio" className="mt-12">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Portfolio</h2>
        {user.portfolioItems.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No portfolio items yet.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.portfolioItems.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="relative aspect-[4/3] w-full bg-zinc-200 dark:bg-zinc-800">
                  {item.mediaType === "VIDEO" ? (
                    <video src={item.url} className="h-full w-full object-cover" controls playsInline muted />
                  ) : isSvg(item.url) ? (
                    <img src={item.url} alt={item.title || ""} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Image src={item.url} alt={item.title || ""} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
                  )}
                </div>
                {item.title ? <p className="p-3 text-sm font-medium text-zinc-900 dark:text-white">{item.title}</p> : null}
                {item.description ? <p className="px-3 pb-3 text-xs text-zinc-600 dark:text-zinc-400">{item.description}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
