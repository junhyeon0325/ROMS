CREATE TABLE "season_maps" (
    "id" BIGSERIAL NOT NULL,
    "season_id" BIGINT NOT NULL,
    "map_id" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "season_maps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "season_maps_season_id_map_id_key" ON "season_maps"("season_id", "map_id");
CREATE UNIQUE INDEX "season_maps_season_id_sort_order_key" ON "season_maps"("season_id", "sort_order");

ALTER TABLE "season_maps" ADD CONSTRAINT "season_maps_season_id_fkey"
FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "season_maps" ADD CONSTRAINT "season_maps_map_id_fkey"
FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
