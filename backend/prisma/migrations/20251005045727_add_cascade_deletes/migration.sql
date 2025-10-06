-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "created_at", "id", "match_id", "sender_id") SELECT "action", "created_at", "id", "match_id", "sender_id" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE TABLE "new_Block" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Block_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Block_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Block" ("blocked_id", "blocker_id", "created_at", "id") SELECT "blocked_id", "blocker_id", "created_at", "id" FROM "Block";
DROP TABLE "Block";
ALTER TABLE "new_Block" RENAME TO "Block";
CREATE UNIQUE INDEX "Block_blocker_id_blocked_id_key" ON "Block"("blocker_id", "blocked_id");
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" DATETIME,
    "roles_snapshot" TEXT,
    CONSTRAINT "Match_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("created_at", "id", "last_message_at", "roles_snapshot", "user_a_id", "user_b_id") SELECT "created_at", "id", "last_message_at", "roles_snapshot", "user_a_id", "user_b_id" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE UNIQUE INDEX "Match_user_a_id_user_b_id_key" ON "Match"("user_a_id", "user_b_id");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" DATETIME,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Message_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("created_at", "flagged", "id", "match_id", "read_at", "sender_id", "text") SELECT "created_at", "flagged", "id", "match_id", "read_at", "sender_id", "text" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordering" INTEGER NOT NULL,
    "blurred" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("blurred", "id", "ordering", "url", "userId") SELECT "blurred", "id", "ordering", "url", "userId" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE TABLE "new_Preference" (
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
    CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Preference" ("age_max", "age_min", "cities", "countries", "distance_km", "education", "height_max", "height_min", "id", "languages", "marital_status", "prayer_freq", "profession", "religiousness_min", "relocate", "show_only_mothers", "userId", "want_children") SELECT "age_max", "age_min", "cities", "countries", "distance_km", "education", "height_max", "height_min", "id", "languages", "marital_status", "prayer_freq", "profession", "religiousness_min", "relocate", "show_only_mothers", "userId", "want_children" FROM "Preference";
DROP TABLE "Preference";
ALTER TABLE "new_Preference" RENAME TO "Preference";
CREATE UNIQUE INDEX "Preference_userId_key" ON "Preference"("userId");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporter_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    CONSTRAINT "Report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("created_at", "id", "reason", "reporter_id", "status", "target_id", "target_type") SELECT "created_at", "id", "reason", "reporter_id", "status", "target_id", "target_type" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE TABLE "new_Swipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "is_super_like" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Swipe_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Swipe_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Swipe" ("created_at", "direction", "from_user_id", "id", "is_super_like", "to_user_id") SELECT "created_at", "direction", "from_user_id", "id", "is_super_like", "to_user_id" FROM "Swipe";
DROP TABLE "Swipe";
ALTER TABLE "new_Swipe" RENAME TO "Swipe";
CREATE INDEX "Swipe_from_user_id_to_user_id_idx" ON "Swipe"("from_user_id", "to_user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
