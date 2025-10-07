-- CreateTable
CREATE TABLE "DiscoverySeen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewer_id" TEXT NOT NULL,
    "seen_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscoverySeen_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscoverySeen_seen_user_id_fkey" FOREIGN KEY ("seen_user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoverySeen_viewer_id_seen_user_id_key" ON "DiscoverySeen"("viewer_id", "seen_user_id");
