-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "CaseInvitation" ADD COLUMN "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING';
