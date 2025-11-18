/*
  Warnings:

  - You are about to drop the column `quantity` on the `DishIngredient` table. All the data in the column will be lost.
  - You are about to drop the column `vitamins` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `mealType` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the `MenuDish` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endDate` to the `Menu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Menu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Menu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campusId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campusId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PositionType" AS ENUM ('PRINCIPAL', 'VICE_PRINCIPAL', 'DIRECTOR', 'FINANCE', 'TEACHER', 'NURSERY_TEACHER', 'LOGISTICS', 'FRONTLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'PROBATION', 'SUSPENDED');

-- DropForeignKey
ALTER TABLE "MenuDish" DROP CONSTRAINT "MenuDish_dishId_fkey";

-- DropForeignKey
ALTER TABLE "MenuDish" DROP CONSTRAINT "MenuDish_menuId_fkey";

-- DropIndex
DROP INDEX "Menu_date_idx";

-- DropIndex
DROP INDEX "Menu_mealType_idx";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "campusId" TEXT;

-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "DishIngredient" DROP COLUMN "quantity",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "vitamins",
ADD COLUMN     "calcium" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "iron" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vitaminA" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vitaminB1" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vitaminB2" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vitaminC" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "zinc" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Menu" DROP COLUMN "date",
DROP COLUMN "mealType",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "campusId" TEXT NOT NULL,
ADD COLUMN     "idCard" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "campusId" TEXT NOT NULL,
ADD COLUMN     "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "hireDate" TIMESTAMP(3),
ADD COLUMN     "idCard" TEXT,
ADD COLUMN     "positionId" TEXT,
ADD COLUMN     "resignationDate" TIMESTAMP(3);

-- DropTable
DROP TABLE "MenuDish";

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "principal" TEXT,
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
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campus_name_idx" ON "Campus"("name");

-- CreateIndex
CREATE INDEX "Position_type_idx" ON "Position"("type");

-- CreateIndex
CREATE INDEX "Position_level_idx" ON "Position"("level");

-- CreateIndex
CREATE INDEX "Position_parentId_idx" ON "Position"("parentId");

-- CreateIndex
CREATE INDEX "MenuItem_menuId_idx" ON "MenuItem"("menuId");

-- CreateIndex
CREATE INDEX "MenuItem_dishId_idx" ON "MenuItem"("dishId");

-- CreateIndex
CREATE INDEX "Class_campusId_idx" ON "Class"("campusId");

-- CreateIndex
CREATE INDEX "Menu_startDate_idx" ON "Menu"("startDate");

-- CreateIndex
CREATE INDEX "Menu_endDate_idx" ON "Menu"("endDate");

-- CreateIndex
CREATE INDEX "Menu_grade_idx" ON "Menu"("grade");

-- CreateIndex
CREATE INDEX "Menu_teacherId_idx" ON "Menu"("teacherId");

-- CreateIndex
CREATE INDEX "Student_campusId_idx" ON "Student"("campusId");

-- CreateIndex
CREATE INDEX "User_campusId_idx" ON "User"("campusId");

-- CreateIndex
CREATE INDEX "User_positionId_idx" ON "User"("positionId");

-- CreateIndex
CREATE INDEX "User_employmentStatus_idx" ON "User"("employmentStatus");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
