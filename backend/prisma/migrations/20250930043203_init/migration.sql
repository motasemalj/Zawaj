-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "mother_for" TEXT,
    "display_name" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "gender" TEXT,
    "city" TEXT,
    "country" TEXT,
    "nationality" TEXT,
    "height_cm" INTEGER,
    "education" TEXT,
    "profession" TEXT,
    "languages" TEXT,
    "marital_status" TEXT,
    "relocate" BOOLEAN DEFAULT false,
    "want_children" TEXT,
    "religiousness" INTEGER,
    "prayer_freq" TEXT,
    "quran_engagement" TEXT,
    "fasting_ramadan" TEXT,
    "hijab_preference" TEXT,
    "spouse_practice" TEXT,
    "interests" TEXT,
    "bio" TEXT,
    "muslim_affirmed" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "discovery_radius_km" INTEGER,
    "privacy_blur_mode" BOOLEAN NOT NULL DEFAULT false,
    "privacy_reveal_on_match" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_active_at" DATETIME
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordering" INTEGER NOT NULL,
    "blurred" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "distance_km" INTEGER,
    "countries" TEXT,
    "cities" TEXT,
    "education" TEXT,
    "profession" TEXT,
    "languages" TEXT,
    "religiousness_min" INTEGER,
    "prayer_freq" TEXT,
    "marital_status" TEXT,
    "relocate" TEXT,
    "want_children" TEXT,
    "height_min" INTEGER,
    "height_max" INTEGER,
    "show_only_mothers" BOOLEAN DEFAULT false,
    CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Swipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Swipe_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Swipe_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" DATETIME,
    "roles_snapshot" TEXT,
    CONSTRAINT "Match_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" DATETIME,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Message_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporter_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    CONSTRAINT "Report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_key" ON "Preference"("userId");

-- CreateIndex
CREATE INDEX "Swipe_from_user_id_to_user_id_idx" ON "Swipe"("from_user_id", "to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Match_user_a_id_user_b_id_key" ON "Match"("user_a_id", "user_b_id");
