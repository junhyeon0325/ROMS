ALTER TABLE "matches" ADD COLUMN "best_of" INTEGER;
ALTER TABLE "match_sets" ALTER COLUMN "map_id" DROP NOT NULL;
ALTER TABLE "match_sets" ALTER COLUMN "winner_team_id" DROP NOT NULL;

ALTER TABLE "match_sets" DROP CONSTRAINT "match_sets_map_id_fkey";
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "match_sets" DROP CONSTRAINT "match_sets_winner_team_id_fkey";
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_winner_team_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "season_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
