-- Crew templates + per-role job invites

ALTER TABLE "Job" ADD COLUMN "invitedFreelancerId" TEXT,
ADD COLUMN "crewRoleLabel" TEXT;

CREATE INDEX "Job_invitedFreelancerId_idx" ON "Job"("invitedFreelancerId");

CREATE TABLE "CrewTemplate" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrewTemplateRole" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "assignedFreelancerId" TEXT,

    CONSTRAINT "CrewTemplateRole_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrewTemplate_ownerId_idx" ON "CrewTemplate"("ownerId");

CREATE INDEX "CrewTemplateRole_templateId_idx" ON "CrewTemplateRole"("templateId");

CREATE INDEX "CrewTemplateRole_assignedFreelancerId_idx" ON "CrewTemplateRole"("assignedFreelancerId");

ALTER TABLE "Job" ADD CONSTRAINT "Job_invitedFreelancerId_fkey" FOREIGN KEY ("invitedFreelancerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrewTemplate" ADD CONSTRAINT "CrewTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrewTemplateRole" ADD CONSTRAINT "CrewTemplateRole_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CrewTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrewTemplateRole" ADD CONSTRAINT "CrewTemplateRole_assignedFreelancerId_fkey" FOREIGN KEY ("assignedFreelancerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
