CREATE TABLE "tournaments" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '개최 예정',
    "organizer" TEXT NOT NULL DEFAULT '',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "teams" INTEGER NOT NULL DEFAULT 0,
    "prize" TEXT NOT NULL DEFAULT '',
    "desc" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournament_schedules" (
    "id" BIGSERIAL NOT NULL,
    "tournament_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "tournament_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tournament_schedules_tournament_id_sort_order_idx" ON "tournament_schedules"("tournament_id", "sort_order");
ALTER TABLE "tournament_schedules" ADD CONSTRAINT "tournament_schedules_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
