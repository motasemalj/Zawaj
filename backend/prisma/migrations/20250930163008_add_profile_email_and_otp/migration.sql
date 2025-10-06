/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "beard" TEXT;
ALTER TABLE "User" ADD COLUMN "dietary_preferences" TEXT;
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "expo_push_token" TEXT;
ALTER TABLE "User" ADD COLUMN "fitness_level" TEXT;
ALTER TABLE "User" ADD COLUMN "halal_diet" TEXT;
ALTER TABLE "User" ADD COLUMN "hijab" TEXT;
ALTER TABLE "User" ADD COLUMN "income_range" TEXT;
ALTER TABLE "User" ADD COLUMN "smoker" TEXT;
ALTER TABLE "User" ADD COLUMN "ward_bio" TEXT;
ALTER TABLE "User" ADD COLUMN "ward_city" TEXT;
ALTER TABLE "User" ADD COLUMN "ward_country" TEXT;
ALTER TABLE "User" ADD COLUMN "ward_display_name" TEXT;
ALTER TABLE "User" ADD COLUMN "ward_dob" DATETIME;
ALTER TABLE "User" ADD COLUMN "ward_education" TEXT;
ALTER TABLE "User" ADD COLUMN "ward_profession" TEXT;

-- CreateTable
CREATE TABLE "EmailOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "EmailOtp_email_idx" ON "EmailOtp"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
