-- Portfolio item: gear tags
ALTER TABLE "PortfolioItem" ADD COLUMN IF NOT EXISTS "gearTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

