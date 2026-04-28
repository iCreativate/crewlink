-- Align User with Supabase Auth (no local password)
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";
