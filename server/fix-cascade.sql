-- Add cascade delete to Failure table
-- This migration adds ON DELETE CASCADE to the contextId foreign key

BEGIN;

-- Drop the existing foreign key constraint
ALTER TABLE "Failure" DROP CONSTRAINT IF EXISTS "Failure_contextId_fkey";

-- Re-add the foreign key with CASCADE delete
ALTER TABLE "Failure" 
  ADD CONSTRAINT "Failure_contextId_fkey" 
  FOREIGN KEY ("contextId") 
  REFERENCES "Context"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

COMMIT;
