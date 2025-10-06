-- AlterTable
ALTER TABLE "Preference" ADD COLUMN "children_preferences" TEXT;
ALTER TABLE "Preference" ADD COLUMN "education_preferences" TEXT;
ALTER TABLE "Preference" ADD COLUMN "height_max_cm" INTEGER;
ALTER TABLE "Preference" ADD COLUMN "height_min_cm" INTEGER;
ALTER TABLE "Preference" ADD COLUMN "marital_status_preferences" TEXT;
ALTER TABLE "Preference" ADD COLUMN "relocate_preference" BOOLEAN;
ALTER TABLE "Preference" ADD COLUMN "sect_preferences" TEXT;
ALTER TABLE "Preference" ADD COLUMN "smoking_preferences" TEXT;
