CREATE TABLE "heroes" (
  "id" BIGSERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "name_en" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'NORMAL',
  "is_pickable" BOOLEAN NOT NULL DEFAULT true,
  "image_url" TEXT,
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "source_key" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "remarks" TEXT,
  CONSTRAINT "heroes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "heroes_name_en_key" ON "heroes"("name_en");
CREATE UNIQUE INDEX "heroes_source_key_key" ON "heroes"("source_key");
CREATE INDEX "heroes_role_idx" ON "heroes"("role");
CREATE INDEX "heroes_is_pickable_idx" ON "heroes"("is_pickable");

ALTER TABLE "hero_bans" ADD CONSTRAINT "hero_bans_hero_id_fkey"
  FOREIGN KEY ("hero_id") REFERENCES "heroes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
