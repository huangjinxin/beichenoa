-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

-- CreateEnum
CREATE TYPE "UserSourceType" AS ENUM ('MANUAL', 'STUDENT', 'TEACHER_SYNC');

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('LEARNING', 'LIFE', 'HEALTH', 'BEHAVIOR', 'ARTWORK');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PurchasePlanStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'ORDERED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PositionType" AS ENUM ('PRINCIPAL', 'VICE_PRINCIPAL', 'DIRECTOR', 'FINANCE', 'TEACHER', 'NURSERY_TEACHER', 'LOGISTICS', 'FRONTLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'PROBATION', 'SUSPENDED');

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

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "principalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PositionType" NOT NULL,
    "level" INTEGER NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "idCard" TEXT,
    "role" "UserRole",
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "gender" TEXT,
    "birthday" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3),
    "resignationDate" TIMESTAMP(3),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvalNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "workplace" TEXT DEFAULT '北辰幼儿园',
    "sourceType" "UserSourceType" NOT NULL DEFAULT 'MANUAL',
    "sourceId" TEXT,
    "campusId" TEXT,
    "positionId" TEXT,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idCard" TEXT,
    "gender" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "enrollDate" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT,
    "allergies" TEXT,
    "address" TEXT,
    "ageGroup" TEXT,
    "birthDate" TIMESTAMP(3),
    "primaryPhone" TEXT,
    "campusId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "relation" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentParent" (
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("studentId","parentId")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "campusId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "RecordType" NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "tags" TEXT[],
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GrowthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminB1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminB2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calcium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iron" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zinc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplierCategory" TEXT,
    "conversionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DishIngredient" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DishIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "grade" TEXT,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "detailTableConfig" JSONB,
    "calculations" JSONB,
    "serialNumberConfig" JSONB,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "presetType" TEXT,
    "shareToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "primaryBusinessType" TEXT,
    "businessActionType" TEXT,
    "fieldMappings" JSONB,
    "uniqueValidations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "submittedBy" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "detailData" JSONB,
    "calculatedValues" JSONB,
    "approvalFlowId" TEXT,
    "approvalStatus" "ApprovalSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "currentNodeSequence" INTEGER NOT NULL DEFAULT 0,
    "syncedToBusinessData" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "query" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionStandard" (
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

-- CreateTable
CREATE TABLE "PurchasePlan" (
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

-- CreateTable
CREATE TABLE "Supplier" (
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

-- CreateTable
CREATE TABLE "PrintToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyObservation" (
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

-- CreateTable
CREATE TABLE "DutyReport" (
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

-- CreateTable
CREATE TABLE "_ClassTeachers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClassTeachers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Campus_name_idx" ON "Campus"("name");

-- CreateIndex
CREATE INDEX "Campus_principalId_idx" ON "Campus"("principalId");

-- CreateIndex
CREATE INDEX "Position_type_idx" ON "Position"("type");

-- CreateIndex
CREATE INDEX "Position_level_idx" ON "Position"("level");

-- CreateIndex
CREATE INDEX "Position_parentId_idx" ON "Position"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_idCard_key" ON "User"("idCard");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_campusId_idx" ON "User"("campusId");

-- CreateIndex
CREATE INDEX "User_positionId_idx" ON "User"("positionId");

-- CreateIndex
CREATE INDEX "User_employmentStatus_idx" ON "User"("employmentStatus");

-- CreateIndex
CREATE INDEX "User_idCard_idx" ON "User"("idCard");

-- CreateIndex
CREATE INDEX "User_sourceType_idx" ON "User"("sourceType");

-- CreateIndex
CREATE INDEX "User_sourceId_idx" ON "User"("sourceId");

-- CreateIndex
CREATE INDEX "User_approvalStatus_idx" ON "User"("approvalStatus");

-- CreateIndex
CREATE INDEX "User_approvedBy_idx" ON "User"("approvedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Student_idCard_key" ON "Student"("idCard");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE INDEX "Student_name_idx" ON "Student"("name");

-- CreateIndex
CREATE INDEX "Student_campusId_idx" ON "Student"("campusId");

-- CreateIndex
CREATE INDEX "Student_ageGroup_idx" ON "Student"("ageGroup");

-- CreateIndex
CREATE INDEX "Student_idCard_idx" ON "Student"("idCard");

-- CreateIndex
CREATE INDEX "Student_primaryPhone_idx" ON "Student"("primaryPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

-- CreateIndex
CREATE INDEX "Parent_phone_idx" ON "Parent"("phone");

-- CreateIndex
CREATE INDEX "Parent_userId_idx" ON "Parent"("userId");

-- CreateIndex
CREATE INDEX "Class_grade_idx" ON "Class"("grade");

-- CreateIndex
CREATE INDEX "Class_campusId_idx" ON "Class"("campusId");

-- CreateIndex
CREATE INDEX "GrowthRecord_studentId_recordedAt_idx" ON "GrowthRecord"("studentId", "recordedAt");

-- CreateIndex
CREATE INDEX "GrowthRecord_type_idx" ON "GrowthRecord"("type");

-- CreateIndex
CREATE INDEX "GrowthRecord_recordedAt_idx" ON "GrowthRecord"("recordedAt");

-- CreateIndex
CREATE INDEX "Ingredient_name_idx" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "Ingredient_supplierCategory_idx" ON "Ingredient"("supplierCategory");

-- CreateIndex
CREATE INDEX "Dish_name_idx" ON "Dish"("name");

-- CreateIndex
CREATE INDEX "Dish_category_idx" ON "Dish"("category");

-- CreateIndex
CREATE INDEX "DishIngredient_dishId_idx" ON "DishIngredient"("dishId");

-- CreateIndex
CREATE INDEX "DishIngredient_ingredientId_idx" ON "DishIngredient"("ingredientId");

-- CreateIndex
CREATE INDEX "Menu_startDate_idx" ON "Menu"("startDate");

-- CreateIndex
CREATE INDEX "Menu_endDate_idx" ON "Menu"("endDate");

-- CreateIndex
CREATE INDEX "Menu_grade_idx" ON "Menu"("grade");

-- CreateIndex
CREATE INDEX "Menu_teacherId_idx" ON "Menu"("teacherId");

-- CreateIndex
CREATE INDEX "MenuItem_menuId_idx" ON "MenuItem"("menuId");

-- CreateIndex
CREATE INDEX "MenuItem_dishId_idx" ON "MenuItem"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_shareToken_key" ON "FormTemplate"("shareToken");

-- CreateIndex
CREATE INDEX "FormTemplate_title_idx" ON "FormTemplate"("title");

-- CreateIndex
CREATE INDEX "FormTemplate_isPreset_idx" ON "FormTemplate"("isPreset");

-- CreateIndex
CREATE INDEX "FormTemplate_presetType_idx" ON "FormTemplate"("presetType");

-- CreateIndex
CREATE INDEX "FormTemplate_shareToken_idx" ON "FormTemplate"("shareToken");

-- CreateIndex
CREATE INDEX "FormTemplate_primaryBusinessType_idx" ON "FormTemplate"("primaryBusinessType");

-- CreateIndex
CREATE INDEX "FormSubmission_templateId_idx" ON "FormSubmission"("templateId");

-- CreateIndex
CREATE INDEX "FormSubmission_submittedBy_idx" ON "FormSubmission"("submittedBy");

-- CreateIndex
CREATE INDEX "FormSubmission_approvalStatus_idx" ON "FormSubmission"("approvalStatus");

-- CreateIndex
CREATE INDEX "FormSubmission_approvalFlowId_idx" ON "FormSubmission"("approvalFlowId");

-- CreateIndex
CREATE INDEX "FormSubmission_serialNumber_idx" ON "FormSubmission"("serialNumber");

-- CreateIndex
CREATE INDEX "FormSubmission_syncedToBusinessData_idx" ON "FormSubmission"("syncedToBusinessData");

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
CREATE INDEX "ReportTemplate_name_idx" ON "ReportTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionStandard_ageGroup_key" ON "NutritionStandard"("ageGroup");

-- CreateIndex
CREATE INDEX "NutritionStandard_ageGroup_idx" ON "NutritionStandard"("ageGroup");

-- CreateIndex
CREATE INDEX "PurchasePlan_startDate_endDate_idx" ON "PurchasePlan"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "PurchasePlan_createdBy_idx" ON "PurchasePlan"("createdBy");

-- CreateIndex
CREATE INDEX "PurchasePlan_status_idx" ON "PurchasePlan"("status");

-- CreateIndex
CREATE INDEX "Supplier_category_idx" ON "Supplier"("category");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PrintToken_token_key" ON "PrintToken"("token");

-- CreateIndex
CREATE INDEX "PrintToken_token_idx" ON "PrintToken"("token");

-- CreateIndex
CREATE INDEX "PrintToken_entityType_entityId_idx" ON "PrintToken"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PrintToken_expiresAt_idx" ON "PrintToken"("expiresAt");

-- CreateIndex
CREATE INDEX "DailyObservation_date_idx" ON "DailyObservation"("date");

-- CreateIndex
CREATE INDEX "DailyObservation_teacherId_idx" ON "DailyObservation"("teacherId");

-- CreateIndex
CREATE INDEX "DailyObservation_classId_idx" ON "DailyObservation"("classId");

-- CreateIndex
CREATE INDEX "DailyObservation_campusId_idx" ON "DailyObservation"("campusId");

-- CreateIndex
CREATE INDEX "DutyReport_date_idx" ON "DutyReport"("date");

-- CreateIndex
CREATE INDEX "DutyReport_campusId_idx" ON "DutyReport"("campusId");

-- CreateIndex
CREATE INDEX "DutyReport_dutyLeaderId_idx" ON "DutyReport"("dutyLeaderId");

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
CREATE INDEX "_ClassTeachers_B_index" ON "_ClassTeachers"("B");

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthRecord" ADD CONSTRAINT "GrowthRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthRecord" ADD CONSTRAINT "GrowthRecord_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishIngredient" ADD CONSTRAINT "DishIngredient_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishIngredient" ADD CONSTRAINT "DishIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "PurchasePlan" ADD CONSTRAINT "PurchasePlan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintToken" ADD CONSTRAINT "PrintToken_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "PurchasePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyObservation" ADD CONSTRAINT "DailyObservation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyObservation" ADD CONSTRAINT "DailyObservation_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyObservation" ADD CONSTRAINT "DailyObservation_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyReport" ADD CONSTRAINT "DutyReport_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyReport" ADD CONSTRAINT "DutyReport_dutyLeaderId_fkey" FOREIGN KEY ("dutyLeaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassTeachers" ADD CONSTRAINT "_ClassTeachers_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassTeachers" ADD CONSTRAINT "_ClassTeachers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
