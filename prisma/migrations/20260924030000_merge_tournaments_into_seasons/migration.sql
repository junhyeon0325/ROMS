BEGIN;

-- 동일한 이름의 기존 시즌이 있으면 자동 병합 대신 수동 매핑을 요구한다.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "tournaments" t
    JOIN "seasons" s ON lower(trim(t."name")) = lower(trim(s."name"))
  ) THEN
    RAISE EXCEPTION '기존 시즌과 이름이 같은 대회가 있어 자동 이전을 중단합니다.';
  END IF;
END $$;

ALTER TABLE "seasons"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT '개최 예정',
  ADD COLUMN "teams" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "prize" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "prize_amount" DECIMAL(18,0),
  ADD COLUMN "desc" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "legacy_tournament_id" BIGINT;

INSERT INTO "seasons" (
  "name", "start_date", "end_date", "status", "teams", "prize", "prize_amount", "desc",
  "created_at", "updated_at", "legacy_tournament_id"
)
SELECT "name", "start_date", "end_date", "status", "teams", "prize", "prize_amount", "desc",
  "created_at", "updated_at", "id"
FROM "tournaments";

ALTER TABLE "tournament_schedules" RENAME TO "season_schedules";
ALTER TABLE "season_schedules" ADD COLUMN "season_id" BIGINT;
UPDATE "season_schedules" sc
SET "season_id" = s."id"
FROM "seasons" s
WHERE s."legacy_tournament_id" = sc."tournament_id";
ALTER TABLE "season_schedules" DROP CONSTRAINT "tournament_schedules_tournament_id_fkey";
ALTER TABLE "season_schedules" DROP COLUMN "tournament_id";
ALTER TABLE "season_schedules" ALTER COLUMN "season_id" SET NOT NULL;
ALTER TABLE "season_schedules" ADD CONSTRAINT "season_schedules_season_id_fkey"
  FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "season_schedules_season_id_sort_order_idx" ON "season_schedules"("season_id", "sort_order");
ALTER TABLE "season_schedules" RENAME CONSTRAINT "tournament_schedules_pkey" TO "season_schedules_pkey";
ALTER SEQUENCE "tournament_schedules_id_seq" RENAME TO "season_schedules_id_seq";

ALTER TABLE "tournament_rank_prizes" RENAME TO "season_rank_prizes";
ALTER TABLE "season_rank_prizes" ADD COLUMN "season_id" BIGINT;
UPDATE "season_rank_prizes" rp
SET "season_id" = s."id"
FROM "seasons" s
WHERE s."legacy_tournament_id" = rp."tournament_id";
ALTER TABLE "season_rank_prizes" DROP CONSTRAINT "tournament_rank_prizes_tournament_id_fkey";
ALTER TABLE "season_rank_prizes" DROP COLUMN "tournament_id";
ALTER TABLE "season_rank_prizes" ALTER COLUMN "season_id" SET NOT NULL;
ALTER TABLE "season_rank_prizes" ADD CONSTRAINT "season_rank_prizes_season_id_fkey"
  FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "season_rank_prizes_season_id_rank_key" ON "season_rank_prizes"("season_id", "rank");
ALTER TABLE "season_rank_prizes" RENAME CONSTRAINT "tournament_rank_prizes_pkey" TO "season_rank_prizes_pkey";
ALTER SEQUENCE "tournament_rank_prizes_id_seq" RENAME TO "season_rank_prizes_id_seq";

DROP TABLE "tournaments";
ALTER TABLE "seasons" DROP COLUMN "legacy_tournament_id";

COMMIT;
