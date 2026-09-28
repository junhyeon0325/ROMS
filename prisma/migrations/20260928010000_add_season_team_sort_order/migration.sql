-- 기존 시즌 팀을 보존하면서 팀장 순서의 시즌별 유일성을 추가한다.
ALTER TABLE "season_teams" ADD COLUMN "sort_order" INTEGER;
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "season_id" ORDER BY "id") AS next_order
  FROM "season_teams"
)
UPDATE "season_teams" AS team SET "sort_order" = ordered.next_order
FROM ordered WHERE team."id" = ordered."id";
CREATE UNIQUE INDEX "season_teams_season_id_sort_order_key" ON "season_teams"("season_id", "sort_order");
