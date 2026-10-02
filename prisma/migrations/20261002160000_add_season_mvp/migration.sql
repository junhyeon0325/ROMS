ALTER TABLE "seasons"
ADD COLUMN "mvp_streamer_id" BIGINT;

ALTER TABLE "seasons"
ADD CONSTRAINT "seasons_mvp_streamer_id_fkey"
FOREIGN KEY ("mvp_streamer_id") REFERENCES "streamers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
