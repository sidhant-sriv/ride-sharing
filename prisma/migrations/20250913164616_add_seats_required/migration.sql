-- AlterTable
ALTER TABLE "public"."trips" ADD COLUMN     "seats_required" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "seats_offered" SET DEFAULT 0;
