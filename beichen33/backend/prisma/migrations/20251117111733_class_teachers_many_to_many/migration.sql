-- CreateTable: 创建班级-教师多对多关系的中间表
CREATE TABLE "_ClassTeachers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ClassTeachers_AB_unique" ON "_ClassTeachers"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassTeachers_B_index" ON "_ClassTeachers"("B");

-- 数据迁移: 将现有的 teacherId 数据迁移到中间表
-- 注意：A 代表 Class.id, B 代表 User.id
INSERT INTO "_ClassTeachers" ("A", "B")
SELECT "id" as "A", "teacherId" as "B"
FROM "Class"
WHERE "teacherId" IS NOT NULL
  AND "deletedAt" IS NULL;

-- DropIndex: 删除旧的 teacherId 索引
DROP INDEX IF EXISTS "Class_teacherId_idx";

-- DropForeignKey: 删除旧的外键约束
ALTER TABLE "Class" DROP CONSTRAINT IF EXISTS "Class_teacherId_fkey";

-- AlterTable: 删除 teacherId 列
ALTER TABLE "Class" DROP COLUMN IF EXISTS "teacherId";

-- AddForeignKey: 添加外键约束
ALTER TABLE "_ClassTeachers" ADD CONSTRAINT "_ClassTeachers_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ClassTeachers" ADD CONSTRAINT "_ClassTeachers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
