-- AlterTable User - Add approval fields and make role nullable
ALTER TABLE "User" ALTER COLUMN "role" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "campusId" DROP NOT NULL;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvalNote" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;

-- CreateIndex for User approval fields
CREATE INDEX IF NOT EXISTS "User_approvalStatus_idx" ON "User"("approvalStatus");
CREATE INDEX IF NOT EXISTS "User_approvedBy_idx" ON "User"("approvedBy");

-- CreateUniqueIndex for User idCard
DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "User_idCard_key" ON "User"("idCard");
EXCEPTION
    WHEN duplicate_key_value THEN null;
END $$;
