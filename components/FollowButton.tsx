"use client";

import { useCallback, useState } from "react";

export function FollowButton({
  userId,
  initialFollowing,
  size = "sm",
}: {
  userId: string;
  initialFollowing: boolean;
  size?: "sm" | "md";
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    const res = await fetch(`/api/follow/${encodeURIComponent(userId)}`, { method: next ? "POST" : "DELETE" });
    if (!res.ok) setFollowing(!next);
    setBusy(false);
  }, [busy, following, userId]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={[
        "pill-button",
        size === "md" ? "px-4 py-2 text-sm" : "px-3 py-2 text-xs",
        following ? "bg-sky-500/10 text-sky-100 dark:bg-sky-400/10" : "",
        busy ? "opacity-70" : "",
      ].join(" ")}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}

