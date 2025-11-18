-- Add principalId column to Campus table
ALTER TABLE "Campus" ADD COLUMN "principalId" TEXT;

-- Create index on principalId
CREATE INDEX "Campus_principalId_idx" ON "Campus"("principalId");

-- Add foreign key constraint
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
