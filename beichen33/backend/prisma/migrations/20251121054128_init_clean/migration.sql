/*
  Warnings:

  - You are about to drop the column `currentApprovalStep` on the `FormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `currentApprovers` on the `FormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `FormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `approvalConfig` on the `FormTemplate` table. All the data in the column will be lost.
  - You are about to drop the `Approval` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[shareToken]` on the table `FormTemplate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Parent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idCard]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Made the column `isPreset` on table `FormTemplate` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserSourceType" AS ENUM ('MANUAL', 'STUDENT', 'TEACHER_SYNC');

-- CreateEnum
CREATE TYPE "ApprovalNodeType" AS ENUM ('SERIAL', 'PARALLEL');

-- CreateEnum
CREATE TYPE "ParallelMode" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "ApprovalTaskStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'TRANSFERRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('APPROVE', 'REJECT', 'RETURN', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ApprovalSubmissionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE');

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_submissionId_fkey";

-- DropIndex
DROP INDEX "FormSubmission_currentApprovalStep_idx";

-- DropIndex
DROP INDEX "FormSubmission_status_idx";

-- AlterTable
ALTER TABLE "FormSubmission" DROP COLUMN "currentApprovalStep",
DROP COLUMN "currentApprovers",
DROP COLUMN "status",
ADD COLUMN     "approvalFlowId" TEXT,
ADD COLUMN     "approvalStatus" "ApprovalSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "currentNodeSequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "syncedAt" TIMESTAMP(3),
ADD COLUMN     "syncedToBusinessData" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FormTemplate" DROP COLUMN "approvalConfig",
ADD COLUMN     "businessActionType" TEXT,
ADD COLUMN     "fieldMappings" JSONB,
ADD COLUMN     "primaryBusinessType" TEXT,
ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "uniqueValidations" JSONB,
ALTER COLUMN "isPreset" SET NOT NULL;

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "primaryPhone" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceType" "UserSourceType" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "_ClassTeachers" ADD CONSTRAINT "_ClassTeachers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ClassTeachers_AB_unique";

-- DropTable
DROP TABLE "Approval";

-- CreateTable
CREATE TABLE "ApprovalFlow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formTemplateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalNode" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "ApprovalNodeType" NOT NULL,
    "parallelMode" "ParallelMode",
    "approvers" JSONB NOT NULL,
    "approverType" TEXT NOT NULL DEFAULT 'user',
    "canReject" BOOLEAN NOT NULL DEFAULT true,
    "canReturn" BOOLEAN NOT NULL DEFAULT true,
    "canTransfer" BOOLEAN NOT NULL DEFAULT false,
    "rejectBehavior" TEXT NOT NULL DEFAULT 'END',
    "timeoutHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalTask" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeName" TEXT NOT NULL,
    "nodeSequence" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalTaskStatus" NOT NULL DEFAULT 'PENDING',
    "action" "ApprovalAction",
    "comment" TEXT,
    "transferredTo" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormEntityBinding" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "fieldMappings" JSONB NOT NULL,
    "triggerOn" TEXT NOT NULL DEFAULT 'approved',
    "uniqueFields" JSONB,
    "defaultValues" JSONB,
    "condition" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormEntityBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormEntityLink" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "previousData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormEntityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessDataLink" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "fieldMappings" JSONB,
    "previousData" JSONB,
    "newData" JSONB,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessDataLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "classId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "campusId" TEXT,
    "classIds" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalFlow_formTemplateId_idx" ON "ApprovalFlow"("formTemplateId");

-- CreateIndex
CREATE INDEX "ApprovalFlow_isActive_idx" ON "ApprovalFlow"("isActive");

-- CreateIndex
CREATE INDEX "ApprovalNode_flowId_idx" ON "ApprovalNode"("flowId");

-- CreateIndex
CREATE INDEX "ApprovalNode_sequence_idx" ON "ApprovalNode"("sequence");

-- CreateIndex
CREATE INDEX "ApprovalTask_submissionId_idx" ON "ApprovalTask"("submissionId");

-- CreateIndex
CREATE INDEX "ApprovalTask_approverId_status_idx" ON "ApprovalTask"("approverId", "status");

-- CreateIndex
CREATE INDEX "ApprovalTask_status_idx" ON "ApprovalTask"("status");

-- CreateIndex
CREATE INDEX "ApprovalTask_assignedAt_idx" ON "ApprovalTask"("assignedAt");

-- CreateIndex
CREATE INDEX "FormEntityBinding_templateId_idx" ON "FormEntityBinding"("templateId");

-- CreateIndex
CREATE INDEX "FormEntityBinding_entityType_idx" ON "FormEntityBinding"("entityType");

-- CreateIndex
CREATE INDEX "FormEntityLink_submissionId_idx" ON "FormEntityLink"("submissionId");

-- CreateIndex
CREATE INDEX "FormEntityLink_entityType_entityId_idx" ON "FormEntityLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "BusinessDataLink_submissionId_idx" ON "BusinessDataLink"("submissionId");

-- CreateIndex
CREATE INDEX "BusinessDataLink_businessType_businessId_idx" ON "BusinessDataLink"("businessType", "businessId");

-- CreateIndex
CREATE INDEX "BusinessDataLink_syncStatus_idx" ON "BusinessDataLink"("syncStatus");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_classId_idx" ON "AttendanceRecord"("date", "classId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_createdBy_idx" ON "AttendanceRecord"("createdBy");

-- CreateIndex
CREATE INDEX "Attendance_recordId_idx" ON "Attendance"("recordId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");

-- CreateIndex
CREATE INDEX "Announcement_campusId_idx" ON "Announcement"("campusId");

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");

-- CreateIndex
CREATE INDEX "Announcement_isActive_idx" ON "Announcement"("isActive");

-- CreateIndex
CREATE INDEX "FormSubmission_approvalStatus_idx" ON "FormSubmission"("approvalStatus");

-- CreateIndex
CREATE INDEX "FormSubmission_approvalFlowId_idx" ON "FormSubmission"("approvalFlowId");

-- CreateIndex
CREATE INDEX "FormSubmission_syncedToBusinessData_idx" ON "FormSubmission"("syncedToBusinessData");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_shareToken_key" ON "FormTemplate"("shareToken");

-- CreateIndex
CREATE INDEX "FormTemplate_shareToken_idx" ON "FormTemplate"("shareToken");

-- CreateIndex
CREATE INDEX "FormTemplate_primaryBusinessType_idx" ON "FormTemplate"("primaryBusinessType");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

-- CreateIndex
CREATE INDEX "Parent_userId_idx" ON "Parent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_idCard_key" ON "Student"("idCard");

-- CreateIndex
CREATE INDEX "Student_idCard_idx" ON "Student"("idCard");

-- CreateIndex
CREATE INDEX "Student_primaryPhone_idx" ON "Student"("primaryPhone");

-- CreateIndex
CREATE INDEX "User_idCard_idx" ON "User"("idCard");

-- CreateIndex
CREATE INDEX "User_sourceType_idx" ON "User"("sourceType");

-- CreateIndex
CREATE INDEX "User_sourceId_idx" ON "User"("sourceId");

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_approvalFlowId_fkey" FOREIGN KEY ("approvalFlowId") REFERENCES "ApprovalFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalFlow" ADD CONSTRAINT "ApprovalFlow_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalNode" ADD CONSTRAINT "ApprovalNode_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ApprovalFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_transferredTo_fkey" FOREIGN KEY ("transferredTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormEntityBinding" ADD CONSTRAINT "FormEntityBinding_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormEntityLink" ADD CONSTRAINT "FormEntityLink_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDataLink" ADD CONSTRAINT "BusinessDataLink_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
