-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Swipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "is_super_like" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Swipe_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Swipe_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Swipe" ("created_at", "direction", "from_user_id", "id", "to_user_id") SELECT "created_at", "direction", "from_user_id", "id", "to_user_id" FROM "Swipe";
DROP TABLE "Swipe";
ALTER TABLE "new_Swipe" RENAME TO "Swipe";
CREATE INDEX "Swipe_from_user_id_to_user_id_idx" ON "Swipe"("from_user_id", "to_user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
