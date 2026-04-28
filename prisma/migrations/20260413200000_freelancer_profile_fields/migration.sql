-- Freelancer profile: specializations, gear tags, availability
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "specializations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "gearTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "availableNow" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Profile_availableNow_idx" ON "Profile"("availableNow");
