-- Extends the map master table for imported Overwatch map metadata and
-- the league-specific official map-pool setting.
ALTER TABLE "maps"
  ADD COLUMN "name_en" TEXT,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "country_code" TEXT,
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "source_key" TEXT;

CREATE UNIQUE INDEX "maps_source_key_key" ON "maps"("source_key");
