-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed';
