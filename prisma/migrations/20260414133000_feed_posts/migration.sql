-- Social feed posts + likes

CREATE TABLE IF NOT EXISTS "FeedPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mediaType" "MediaType",
    "mediaUrl" TEXT,
    "collab" BOOLEAN NOT NULL DEFAULT false,
    "collabNote" TEXT,
    "sharedPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeedPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedPostLike_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FeedPost_authorId_idx" ON "FeedPost"("authorId");
CREATE INDEX IF NOT EXISTS "FeedPost_createdAt_idx" ON "FeedPost"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "FeedPost_sharedPostId_idx" ON "FeedPost"("sharedPostId");

CREATE UNIQUE INDEX IF NOT EXISTS "FeedPostLike_postId_userId_key" ON "FeedPostLike"("postId", "userId");
CREATE INDEX IF NOT EXISTS "FeedPostLike_userId_idx" ON "FeedPostLike"("userId");
CREATE INDEX IF NOT EXISTS "FeedPostLike_createdAt_idx" ON "FeedPostLike"("createdAt" DESC);

ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_sharedPostId_fkey" FOREIGN KEY ("sharedPostId") REFERENCES "FeedPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FeedPostLike" ADD CONSTRAINT "FeedPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedPostLike" ADD CONSTRAINT "FeedPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

