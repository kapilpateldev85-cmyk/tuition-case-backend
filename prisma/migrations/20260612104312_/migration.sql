-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'TUTOR');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseSubject" AS ENUM ('MATHEMATICS', 'ENGLISH', 'CHINESE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'HISTORY', 'GEOGRAPHY', 'ECONOMICS', 'OTHER');

-- CreateEnum
CREATE TYPE "CaseLevel" AS ENUM ('P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'JC1', 'JC2');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "qualifications" TEXT,
    "experiences" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorDocument" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" "CaseSubject" NOT NULL,
    "level" "CaseLevel" NOT NULL,
    "location" TEXT NOT NULL,
    "budgetPerHour" DOUBLE PRECISION NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseInvitation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

-- CreateIndex
CREATE INDEX "Parent_userId_idx" ON "Parent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_userId_key" ON "Tutor"("userId");

-- CreateIndex
CREATE INDEX "Tutor_userId_idx" ON "Tutor"("userId");

-- CreateIndex
CREATE INDEX "TutorDocument_tutorId_idx" ON "TutorDocument"("tutorId");

-- CreateIndex
CREATE INDEX "TutorDocument_userId_idx" ON "TutorDocument"("userId");

-- CreateIndex
CREATE INDEX "Case_ownerId_idx" ON "Case"("ownerId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_subject_idx" ON "Case"("subject");

-- CreateIndex
CREATE INDEX "Case_level_idx" ON "Case"("level");

-- CreateIndex
CREATE INDEX "CaseInvitation_caseId_idx" ON "CaseInvitation"("caseId");

-- CreateIndex
CREATE INDEX "CaseInvitation_tutorId_idx" ON "CaseInvitation"("tutorId");

-- CreateIndex
CREATE INDEX "CaseInvitation_invitedById_idx" ON "CaseInvitation"("invitedById");

-- CreateIndex
CREATE UNIQUE INDEX "CaseInvitation_caseId_tutorId_key" ON "CaseInvitation"("caseId", "tutorId");

-- CreateIndex
CREATE INDEX "Document_caseId_idx" ON "Document"("caseId");

-- CreateIndex
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorDocument" ADD CONSTRAINT "TutorDocument_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorDocument" ADD CONSTRAINT "TutorDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseInvitation" ADD CONSTRAINT "CaseInvitation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseInvitation" ADD CONSTRAINT "CaseInvitation_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseInvitation" ADD CONSTRAINT "CaseInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
