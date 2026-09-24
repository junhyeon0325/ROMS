-- 팀 편성 전에도 대회별 스트리머와 복수 참가 역할을 저장한다.
CREATE TABLE "season_participants" (
    "id" BIGSERIAL NOT NULL,
    "season_id" BIGINT NOT NULL,
    "streamer_id" BIGINT NOT NULL,
    "roles" TEXT[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "season_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "season_participants_season_id_streamer_id_key" ON "season_participants"("season_id", "streamer_id");
ALTER TABLE "season_participants" ADD CONSTRAINT "season_participants_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "season_participants" ADD CONSTRAINT "season_participants_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "streamers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
