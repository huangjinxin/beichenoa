-- CreateEnum
CREATE TYPE "PurchasePlanStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'ORDERED', 'COMPLETED');

-- AlterTable - Add bank info to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankAccount" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workplace" TEXT DEFAULT '北辰幼儿园';

-- AlterTable - Campus
ALTER TABLE "Campus" DROP COLUMN IF EXISTS "principal";
ALTER TABLE "Campus" ADD COLUMN IF NOT EXISTS "principalId" TEXT;

-- CreateIndex for Campus
CREATE INDEX IF NOT EXISTS "Campus_principalId_idx" ON "Campus"("principalId");

-- AlterTable - Student
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "ageGroup" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);

-- CreateIndex for Student
CREATE INDEX IF NOT EXISTS "Student_ageGroup_idx" ON "Student"("ageGroup");

-- AlterTable - Ingredient
ALTER TABLE "Ingredient" ADD COLUMN IF NOT EXISTS "supplierCategory" TEXT;
ALTER TABLE "Ingredient" ADD COLUMN IF NOT EXISTS "conversionRate" DOUBLE PRECISION;

-- CreateIndex for Ingredient
CREATE INDEX IF NOT EXISTS "Ingredient_supplierCategory_idx" ON "Ingredient"("supplierCategory");

-- AlterTable - FormTemplate
ALTER TABLE "FormTemplate" ADD COLUMN IF NOT EXISTS "detailTableConfig" JSONB;
ALTER TABLE "FormTemplate" ADD COLUMN IF NOT EXISTS "calculations" JSONB;
ALTER TABLE "FormTemplate" ADD COLUMN IF NOT EXISTS "approvalConfig" JSONB;
ALTER TABLE "FormTemplate" ADD COLUMN IF NOT EXISTS "serialNumberConfig" JSONB;
ALTER TABLE "FormTemplate" ADD COLUMN IF NOT EXISTS "isPreset" BOOLEAN DEFAULT false;
ALTER TABLE "FormTemplate" ADD COLUMN IF NOT EXISTS "presetType" TEXT;

-- CreateIndex for FormTemplate
CREATE INDEX IF NOT EXISTS "FormTemplate_isPreset_idx" ON "FormTemplate"("isPreset");
CREATE INDEX IF NOT EXISTS "FormTemplate_presetType_idx" ON "FormTemplate"("presetType");

-- AlterTable - FormSubmission
ALTER TABLE "FormSubmission" ADD COLUMN IF NOT EXISTS "serialNumber" TEXT;
ALTER TABLE "FormSubmission" ADD COLUMN IF NOT EXISTS "detailData" JSONB;
ALTER TABLE "FormSubmission" ADD COLUMN IF NOT EXISTS "calculatedValues" JSONB;
ALTER TABLE "FormSubmission" ADD COLUMN IF NOT EXISTS "currentApprovalStep" INTEGER DEFAULT 0;
ALTER TABLE "FormSubmission" ADD COLUMN IF NOT EXISTS "currentApprovers" JSONB;

-- CreateIndex for FormSubmission
CREATE INDEX IF NOT EXISTS "FormSubmission_serialNumber_idx" ON "FormSubmission"("serialNumber");
CREATE INDEX IF NOT EXISTS "FormSubmission_currentApprovalStep_idx" ON "FormSubmission"("currentApprovalStep");

-- AlterTable - Approval
ALTER TABLE "Approval" ADD COLUMN IF NOT EXISTS "step" INTEGER DEFAULT 0;
ALTER TABLE "Approval" ADD COLUMN IF NOT EXISTS "stepName" TEXT DEFAULT '';
ALTER TABLE "Approval" ADD COLUMN IF NOT EXISTS "approverName" TEXT DEFAULT '';
ALTER TABLE "Approval" ADD COLUMN IF NOT EXISTS "action" TEXT;
ALTER TABLE "Approval" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

-- CreateIndex for Approval
CREATE INDEX IF NOT EXISTS "Approval_status_idx" ON "Approval"("status");
CREATE INDEX IF NOT EXISTS "Approval_step_idx" ON "Approval"("step");

-- CreateTable - NutritionStandard
CREATE TABLE IF NOT EXISTS "NutritionStandard" (
    "id" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "ageLabel" TEXT NOT NULL,
    "caloriesMin" DOUBLE PRECISION NOT NULL,
    "caloriesMax" DOUBLE PRECISION NOT NULL,
    "proteinMin" DOUBLE PRECISION NOT NULL,
    "proteinMax" DOUBLE PRECISION NOT NULL,
    "fatMin" DOUBLE PRECISION NOT NULL,
    "fatMax" DOUBLE PRECISION NOT NULL,
    "carbsMin" DOUBLE PRECISION NOT NULL,
    "carbsMax" DOUBLE PRECISION NOT NULL,
    "breakfastRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "lunchRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.40,
    "snackRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "dinnerRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "grainPerMeal" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "vegetablePerMeal" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "meatPerMeal" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "eggPerMeal" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "milkPerDay" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionStandard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NutritionStandard_ageGroup_key" ON "NutritionStandard"("ageGroup");
CREATE INDEX IF NOT EXISTS "NutritionStandard_ageGroup_idx" ON "NutritionStandard"("ageGroup");

-- CreateTable - PurchasePlan
CREATE TABLE IF NOT EXISTS "PurchasePlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "menuId" TEXT,
    "studentStats" JSONB NOT NULL,
    "purchaseItems" JSONB NOT NULL,
    "dailyPurchaseItems" JSONB,
    "status" "PurchasePlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasePlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PurchasePlan_startDate_endDate_idx" ON "PurchasePlan"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "PurchasePlan_createdBy_idx" ON "PurchasePlan"("createdBy");
CREATE INDEX IF NOT EXISTS "PurchasePlan_status_idx" ON "PurchasePlan"("status");

-- CreateTable - Supplier
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Supplier_category_idx" ON "Supplier"("category");
CREATE INDEX IF NOT EXISTS "Supplier_name_idx" ON "Supplier"("name");

-- CreateTable - PrintToken
CREATE TABLE IF NOT EXISTS "PrintToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrintToken_token_key" ON "PrintToken"("token");
CREATE INDEX IF NOT EXISTS "PrintToken_token_idx" ON "PrintToken"("token");
CREATE INDEX IF NOT EXISTS "PrintToken_entityType_entityId_idx" ON "PrintToken"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "PrintToken_expiresAt_idx" ON "PrintToken"("expiresAt");

-- CreateTable - DailyObservation
CREATE TABLE IF NOT EXISTS "DailyObservation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weather" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "campusId" TEXT,
    "timeline" JSONB,
    "lifeActivity" TEXT,
    "outdoorActivity" TEXT,
    "learningActivity" TEXT,
    "gameActivity" TEXT,
    "wonderfulMoment" TEXT,
    "homeCooperation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyObservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DailyObservation_date_idx" ON "DailyObservation"("date");
CREATE INDEX IF NOT EXISTS "DailyObservation_teacherId_idx" ON "DailyObservation"("teacherId");
CREATE INDEX IF NOT EXISTS "DailyObservation_classId_idx" ON "DailyObservation"("classId");
CREATE INDEX IF NOT EXISTS "DailyObservation_campusId_idx" ON "DailyObservation"("campusId");

-- CreateTable - DutyReport
CREATE TABLE IF NOT EXISTS "DutyReport" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weather" TEXT NOT NULL,
    "dutyLeader" TEXT NOT NULL,
    "dutyLeaderId" TEXT,
    "campusId" TEXT,
    "attendance" TEXT,
    "entryExit" TEXT,
    "learningActivity" TEXT,
    "areaActivity" TEXT,
    "outdoorActivity" TEXT,
    "lifeActivity" TEXT,
    "notice" TEXT,
    "safety" TEXT,
    "other" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DutyReport_date_idx" ON "DutyReport"("date");
CREATE INDEX IF NOT EXISTS "DutyReport_campusId_idx" ON "DutyReport"("campusId");
CREATE INDEX IF NOT EXISTS "DutyReport_dutyLeaderId_idx" ON "DutyReport"("dutyLeaderId");

-- AddForeignKey - Campus principalId
DO $$ BEGIN
    ALTER TABLE "Campus" ADD CONSTRAINT "Campus_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey - PurchasePlan
DO $$ BEGIN
    ALTER TABLE "PurchasePlan" ADD CONSTRAINT "PurchasePlan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey - PrintToken
DO $$ BEGIN
    ALTER TABLE "PrintToken" ADD CONSTRAINT "PrintToken_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "PurchasePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey - DailyObservation
DO $$ BEGIN
    ALTER TABLE "DailyObservation" ADD CONSTRAINT "DailyObservation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DailyObservation" ADD CONSTRAINT "DailyObservation_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DailyObservation" ADD CONSTRAINT "DailyObservation_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey - DutyReport
DO $$ BEGIN
    ALTER TABLE "DutyReport" ADD CONSTRAINT "DutyReport_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DutyReport" ADD CONSTRAINT "DutyReport_dutyLeaderId_fkey" FOREIGN KEY ("dutyLeaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update Approval table - make columns NOT NULL after adding defaults
UPDATE "Approval" SET "step" = 0 WHERE "step" IS NULL;
UPDATE "Approval" SET "stepName" = '' WHERE "stepName" IS NULL;
UPDATE "Approval" SET "approverName" = '' WHERE "approverName" IS NULL;

ALTER TABLE "Approval" ALTER COLUMN "step" SET NOT NULL;
ALTER TABLE "Approval" ALTER COLUMN "stepName" SET NOT NULL;
ALTER TABLE "Approval" ALTER COLUMN "approverName" SET NOT NULL;
ALTER TABLE "Approval" ALTER COLUMN "step" DROP DEFAULT;
ALTER TABLE "Approval" ALTER COLUMN "stepName" DROP DEFAULT;
ALTER TABLE "Approval" ALTER COLUMN "approverName" DROP DEFAULT;
