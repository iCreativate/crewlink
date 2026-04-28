import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";

export function CreatorCard({
  viewerId,
  user,
  initialFollowing,
}: {
  viewerId: string;
  user: { id: string; name: string | null; image: string | null; role: string; headline?: string | null };
  initialFollowing: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={`/profile/${user.id}`} className="flex min-w-0 items-center gap-3 rounded-2xl pr-2 hover:bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.image ?? "/seed/avatar-m1.svg"} alt="" className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{user.name ?? "Creator"}</p>
          <p className="meta-text truncate">{user.headline?.trim() || (user.role === "MEDIA_HOUSE" ? "Media house" : "Freelancer")}</p>
        </div>
      </Link>
      {user.id === viewerId ? (
        <Link href={`/profile/${user.id}`} className="pill-button px-3 py-2 text-xs">
          View
        </Link>
      ) : (
        <FollowButton userId={user.id} initialFollowing={initialFollowing} />
      )}
    </div>
  );
}

