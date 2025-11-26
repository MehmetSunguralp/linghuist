-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "correctedBy" TEXT,
ADD COLUMN     "correction" TEXT,
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "edited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalContent" TEXT;
