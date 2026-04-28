-- Emergency mode: urgent broadcast to nearby freelancers

ALTER TABLE "Job" ADD COLUMN "emergencyMode" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Job_emergencyMode_idx" ON "Job"("emergencyMode");
