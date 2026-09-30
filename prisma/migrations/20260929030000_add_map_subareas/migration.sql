CREATE TABLE "map_subareas" (
    "id" BIGSERIAL NOT NULL,
    "map_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "map_subareas_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "match_sets" ADD COLUMN "map_subarea_id" BIGINT;

CREATE INDEX "map_subareas_map_id_sort_order_idx" ON "map_subareas"("map_id", "sort_order");

ALTER TABLE "map_subareas" ADD CONSTRAINT "map_subareas_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_map_subarea_id_fkey" FOREIGN KEY ("map_subarea_id") REFERENCES "map_subareas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
