ALTER TABLE "match_sets"
RENAME COLUMN "team_a_push_score" TO "team_a_escort_score";

ALTER TABLE "match_sets"
RENAME COLUMN "team_b_push_score" TO "team_b_escort_score";

ALTER TABLE "match_sets"
ADD COLUMN "escort_first_attack_team_id" BIGINT,
ADD COLUMN "team_a_escort_distance_meters" DOUBLE PRECISION,
ADD COLUMN "team_b_escort_distance_meters" DOUBLE PRECISION;
