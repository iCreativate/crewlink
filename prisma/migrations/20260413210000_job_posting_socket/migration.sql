-- Job posting: schedule, pay rate, gear, acceptance
ALTER TABLE "Job" ALTER COLUMN "description" SET DEFAULT '';

UPDATE "Job" SET "description" = '' WHERE "description" IS NULL;

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "payRate" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "gearRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "acceptedById" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Job_acceptedById_fkey'
  ) THEN
    ALTER TABLE "Job" ADD CONSTRAINT "Job_acceptedById_fkey"
      FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Job_startsAt_idx" ON "Job"("startsAt");
