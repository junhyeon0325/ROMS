ALTER TABLE "match_sets" ADD COLUMN "team_a_color" TEXT NOT NULL DEFAULT 'BLUE';

ALTER TABLE "hero_bans" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 1;

WITH ordered_bans AS (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "match_set_id" ORDER BY "id")::INTEGER AS "sort_order"
    FROM "hero_bans"
)
UPDATE "hero_bans" AS bans
SET "sort_order" = ordered_bans."sort_order"
FROM ordered_bans
WHERE bans."id" = ordered_bans."id";

CREATE INDEX "hero_bans_match_set_id_sort_order_idx" ON "hero_bans"("match_set_id", "sort_order");

ALTER TABLE "player_set_stats" RENAME COLUMN "main_hero_ids" TO "used_hero_ids";
ALTER TABLE "player_set_stats" RENAME COLUMN "is_mvp" TO "is_potg";
