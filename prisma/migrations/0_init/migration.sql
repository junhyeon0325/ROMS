-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('TANK', 'DAMAGE', 'HEALER');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emblem_url" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streamers" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "profile_image_url" TEXT,
    "chzzk_channel_url" TEXT,
    "youtube_channel_url" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "streamers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_teams" (
    "id" BIGSERIAL NOT NULL,
    "season_id" BIGINT NOT NULL,
    "team_id" BIGINT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "season_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_team_members" (
    "id" BIGSERIAL NOT NULL,
    "season_team_id" BIGINT NOT NULL,
    "streamer_id" BIGINT NOT NULL,
    "position" "Position" NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "season_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" BIGSERIAL NOT NULL,
    "season_id" BIGINT NOT NULL,
    "tournament_stage" TEXT NOT NULL,
    "match_date" TIMESTAMP(3),
    "team_a_id" BIGINT NOT NULL,
    "team_b_id" BIGINT NOT NULL,
    "winner_team_id" BIGINT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maps" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "map_type" TEXT NOT NULL,
    "image_url" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_sets" (
    "id" BIGSERIAL NOT NULL,
    "match_id" BIGINT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "map_id" BIGINT NOT NULL,
    "winner_team_id" BIGINT NOT NULL,
    "game_duration_seconds" INTEGER,
    "vod_url" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "match_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_set_stats" (
    "id" BIGSERIAL NOT NULL,
    "match_set_id" BIGINT NOT NULL,
    "streamer_id" BIGINT NOT NULL,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "damage" INTEGER NOT NULL DEFAULT 0,
    "healing" INTEGER NOT NULL DEFAULT 0,
    "mitigated_damage" INTEGER NOT NULL DEFAULT 0,
    "main_hero_ids" TEXT,
    "is_mvp" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "player_set_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_bans" (
    "id" BIGSERIAL NOT NULL,
    "match_set_id" BIGINT NOT NULL,
    "team_id" BIGINT NOT NULL,
    "hero_id" BIGINT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "hero_bans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "season_teams" ADD CONSTRAINT "season_teams_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_teams" ADD CONSTRAINT "season_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_team_members" ADD CONSTRAINT "season_team_members_season_team_id_fkey" FOREIGN KEY ("season_team_id") REFERENCES "season_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_team_members" ADD CONSTRAINT "season_team_members_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "streamers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_set_stats" ADD CONSTRAINT "player_set_stats_match_set_id_fkey" FOREIGN KEY ("match_set_id") REFERENCES "match_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_set_stats" ADD CONSTRAINT "player_set_stats_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "streamers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_bans" ADD CONSTRAINT "hero_bans_match_set_id_fkey" FOREIGN KEY ("match_set_id") REFERENCES "match_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_bans" ADD CONSTRAINT "hero_bans_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
