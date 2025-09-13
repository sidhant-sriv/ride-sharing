/*
  Warnings:

  - You are about to drop the `Trip` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "public"."TripStatus" AS ENUM ('pending', 'matched', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('proposed', 'accepted', 'rejected', 'cancelled');

-- DropForeignKey
ALTER TABLE "public"."Trip" DROP CONSTRAINT "Trip_userId_fkey";

-- DropTable
DROP TABLE "public"."Trip";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" "public"."Gender",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trips" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "pickup_lat" DOUBLE PRECISION NOT NULL,
    "pickup_lng" DOUBLE PRECISION NOT NULL,
    "drop_off_lat" DOUBLE PRECISION NOT NULL,
    "drop_off_lng" DOUBLE PRECISION NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "seats_offered" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."TripStatus" NOT NULL DEFAULT 'pending',
    "polyline" TEXT,
    "route_length_m" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matches" (
    "id" TEXT NOT NULL,
    "trip_a_id" TEXT NOT NULL,
    "trip_b_id" TEXT NOT NULL,
    "match_score" DOUBLE PRECISION,
    "status" "public"."MatchStatus" NOT NULL DEFAULT 'proposed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "public"."users"("phone_number");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "public"."trips"("status");

-- CreateIndex
CREATE INDEX "trips_departure_time_idx" ON "public"."trips"("departure_time");

-- CreateIndex
CREATE INDEX "trips_pickup_lat_pickup_lng_idx" ON "public"."trips"("pickup_lat", "pickup_lng");

-- CreateIndex
CREATE INDEX "matches_trip_a_id_idx" ON "public"."matches"("trip_a_id");

-- CreateIndex
CREATE INDEX "matches_trip_b_id_idx" ON "public"."matches"("trip_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_trip_a_id_trip_b_id_key" ON "public"."matches"("trip_a_id", "trip_b_id");

-- AddForeignKey
ALTER TABLE "public"."trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_trip_a_id_fkey" FOREIGN KEY ("trip_a_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_trip_b_id_fkey" FOREIGN KEY ("trip_b_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
