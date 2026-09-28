-- 기존 소속을 유지하면서 시즌 범위 중복 배정과 감독의 빈 포지션을 지원한다.
ALTER TABLE "season_team_members" ADD COLUMN "season_id" BIGINT;
UPDATE "season_team_members" AS member SET "season_id" = season_team."season_id"
FROM "season_teams" AS season_team WHERE member."season_team_id" = season_team."id";
ALTER TABLE "season_team_members" ALTER COLUMN "season_id" SET NOT NULL;
ALTER TABLE "season_team_members" ALTER COLUMN "position" TYPE TEXT USING "position"::TEXT;
ALTER TABLE "season_team_members" ALTER COLUMN "position" DROP NOT NULL;
ALTER TABLE "season_participants" ADD COLUMN "draft_order" INTEGER;
CREATE UNIQUE INDEX "season_teams_season_id_team_id_key" ON "season_teams"("season_id", "team_id");
CREATE UNIQUE INDEX "season_team_members_season_id_streamer_id_key" ON "season_team_members"("season_id", "streamer_id");
CREATE UNIQUE INDEX "season_participants_season_id_draft_order_key" ON "season_participants"("season_id", "draft_order");
