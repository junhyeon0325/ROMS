ALTER TABLE "match_sets"
ADD COLUMN "hybrid_first_attack_team_id" BIGINT;

ALTER TABLE "match_sets"
ADD COLUMN "hybrid_turn_results" TEXT;

ALTER TABLE "player_set_stats"
ADD COLUMN "used_hero_turns" TEXT;
