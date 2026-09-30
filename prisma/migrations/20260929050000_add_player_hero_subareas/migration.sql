ALTER TABLE "player_set_stats"
ADD COLUMN "used_hero_subareas" TEXT;

UPDATE "player_set_stats" AS stats
SET "used_hero_subareas" = (
  SELECT jsonb_object_agg(used.hero_id, jsonb_build_array(match_set."map_subarea_id"::text))::text
  FROM "match_sets" AS match_set
  CROSS JOIN LATERAL jsonb_array_elements_text(stats."used_hero_ids"::jsonb) AS used(hero_id)
  WHERE match_set."id" = stats."match_set_id"
    AND match_set."map_subarea_id" IS NOT NULL
)
WHERE stats."used_hero_ids" ~ '^\s*\['
  AND EXISTS (
    SELECT 1 FROM "match_sets" AS match_set
    WHERE match_set."id" = stats."match_set_id"
      AND match_set."map_subarea_id" IS NOT NULL
  );