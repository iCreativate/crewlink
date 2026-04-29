-- Bring FeedPost table in line with current Prisma schema.
-- This migration is written to be idempotent/safe on environments that may already have some columns.

-- Enums (created in schema.prisma but missing in early migrations)
DO $$ BEGIN
  CREATE TYPE "FeedPostKind" AS ENUM ('POST', 'AD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FeedAdType" AS ENUM ('SPONSORED_POST', 'OPPORTUNITY', 'FEATURED_CREATOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Missing columns
ALTER TABLE "FeedPost"
  ADD COLUMN IF NOT EXISTS "kind" "FeedPostKind" NOT NULL DEFAULT 'POST',
  ADD COLUMN IF NOT EXISTS "adType" "FeedAdType",
  ADD COLUMN IF NOT EXISTS "ctaLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "ctaHref" TEXT,
  ADD COLUMN IF NOT EXISTS "bts" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "collaborators" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "boostedUntil" TIMESTAMP(3);

-- Indexes used by the app
CREATE INDEX IF NOT EXISTS "FeedPost_boostedUntil_idx" ON "FeedPost"("boostedUntil");

