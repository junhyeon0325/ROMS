-- 팀의 시즌별 관계가 정확히 하나인지 확인해 이동할 수 없는 데이터를 보호한다.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "teams" AS team
    LEFT JOIN "season_teams" AS season_team ON season_team."team_id" = team."id"
    GROUP BY team."id" HAVING COUNT(season_team."id") <> 1
  ) THEN
    RAISE EXCEPTION '시즌에 연결되지 않았거나 여러 시즌에서 공유하는 팀이 있어 병합을 중단했습니다.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "matches" AS match
    LEFT JOIN "season_teams" AS team_a ON team_a."team_id" = match."team_a_id" AND team_a."season_id" = match."season_id"
    LEFT JOIN "season_teams" AS team_b ON team_b."team_id" = match."team_b_id" AND team_b."season_id" = match."season_id"
    LEFT JOIN "season_teams" AS winner ON winner."team_id" = match."winner_team_id" AND winner."season_id" = match."season_id"
    WHERE team_a."id" IS NULL OR team_b."id" IS NULL OR (match."winner_team_id" IS NOT NULL AND winner."id" IS NULL)
  ) OR EXISTS (
    SELECT 1 FROM "match_sets" AS match_set
    JOIN "matches" AS match ON match."id" = match_set."match_id"
    LEFT JOIN "season_teams" AS winner ON winner."team_id" = match_set."winner_team_id" AND winner."season_id" = match."season_id"
    WHERE winner."id" IS NULL
  ) OR EXISTS (
    SELECT 1 FROM "hero_bans" AS ban
    JOIN "match_sets" AS match_set ON match_set."id" = ban."match_set_id"
    JOIN "matches" AS match ON match."id" = match_set."match_id"
    LEFT JOIN "season_teams" AS team ON team."team_id" = ban."team_id" AND team."season_id" = match."season_id"
    WHERE team."id" IS NULL
  ) THEN
    RAISE EXCEPTION '경기 또는 영웅 밴에서 해당 시즌의 팀을 찾을 수 없어 병합을 중단했습니다.';
  END IF;
END $$;

-- 팀 기본정보와 감사 정보를 기존 시즌 팀 행으로 옮긴다.
ALTER TABLE "season_teams" ADD COLUMN "name" TEXT;
ALTER TABLE "season_teams" ADD COLUMN "emblem_url" TEXT;
UPDATE "season_teams" AS season_team SET
  "name" = team."name",
  "emblem_url" = team."emblem_url",
  "created_by" = team."created_by",
  "created_at" = team."created_at",
  "updated_by" = team."updated_by",
  "updated_at" = team."updated_at",
  "remarks" = team."remarks"
FROM "teams" AS team WHERE season_team."team_id" = team."id";
ALTER TABLE "season_teams" ALTER COLUMN "name" SET NOT NULL;

-- 기존 팀 ID를 시즌 팀 ID로 치환한 뒤 새 참조 무결성을 건다.
ALTER TABLE "hero_bans" DROP CONSTRAINT "hero_bans_team_id_fkey";
UPDATE "matches" AS match SET "team_a_id" = season_team."id"
FROM "season_teams" AS season_team
WHERE match."team_a_id" = season_team."team_id" AND match."season_id" = season_team."season_id";
UPDATE "matches" AS match SET "team_b_id" = season_team."id"
FROM "season_teams" AS season_team
WHERE match."team_b_id" = season_team."team_id" AND match."season_id" = season_team."season_id";
UPDATE "matches" AS match SET "winner_team_id" = season_team."id"
FROM "season_teams" AS season_team
WHERE match."winner_team_id" = season_team."team_id" AND match."season_id" = season_team."season_id";
UPDATE "match_sets" AS match_set SET "winner_team_id" = season_team."id"
FROM "matches" AS match, "season_teams" AS season_team
WHERE match_set."match_id" = match."id" AND match_set."winner_team_id" = season_team."team_id" AND match."season_id" = season_team."season_id";
UPDATE "hero_bans" AS ban SET "team_id" = season_team."id"
FROM "match_sets" AS match_set, "matches" AS match, "season_teams" AS season_team
WHERE ban."match_set_id" = match_set."id" AND match_set."match_id" = match."id"
  AND ban."team_id" = season_team."team_id" AND match."season_id" = season_team."season_id";

ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_fkey" FOREIGN KEY ("team_a_id") REFERENCES "season_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_fkey" FOREIGN KEY ("team_b_id") REFERENCES "season_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "season_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_winner_team_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "season_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hero_bans" ADD CONSTRAINT "hero_bans_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "season_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "season_teams_season_id_team_id_key";
ALTER TABLE "season_teams" DROP CONSTRAINT "season_teams_team_id_fkey";
ALTER TABLE "season_teams" DROP COLUMN "team_id";
DROP TABLE "teams";
