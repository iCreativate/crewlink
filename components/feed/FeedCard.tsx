"use client";

import { FeedPostCard, type FeedPost } from "@/components/feed/FeedPostCard";

export function FeedCard({
  post,
  onPatch,
}: {
  post: FeedPost;
  onPatch: (id: string, patch: Partial<FeedPost>) => void;
}) {
  return <FeedPostCard post={post} onPatch={onPatch} />;
}

