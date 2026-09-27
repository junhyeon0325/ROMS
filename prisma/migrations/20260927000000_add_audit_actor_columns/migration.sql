ALTER TABLE "season_schedules"
  ADD COLUMN "created_by" TEXT,
  ADD COLUMN "updated_by" TEXT;

ALTER TABLE "season_rank_prizes"
  ADD COLUMN "created_by" TEXT,
  ADD COLUMN "updated_by" TEXT;

ALTER TABLE "season_participants"
  ADD COLUMN "created_by" TEXT,
  ADD COLUMN "updated_by" TEXT;

ALTER TABLE "season_maps"
  ADD COLUMN "created_by" TEXT,
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_by" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "season_maps"
  ALTER COLUMN "created_at" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;
