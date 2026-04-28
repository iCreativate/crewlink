-- Add boostedUntil fields for account/post boosting.
-- This migration exists because the schema had the fields but earlier migrations didn't include them.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "boostedUntil" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "User_boostedUntil_idx" ON "User"("boostedUntil");

ALTER TABLE "FeedPost" ADD COLUMN IF NOT EXISTS "boostedUntil" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "FeedPost_boostedUntil_idx" ON "FeedPost"("boostedUntil");

