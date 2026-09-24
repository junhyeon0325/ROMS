-- 기존 일정의 시작·종료 일시는 보존하고 신규 일정의 빈 날짜를 허용한다.
ALTER TABLE "tournament_schedules" ALTER COLUMN "start_at" DROP NOT NULL;
ALTER TABLE "tournament_schedules" ALTER COLUMN "end_at" DROP NOT NULL;

-- 기존 문자열 상금은 유지하고 정확한 숫자 상금을 별도 컬럼에 저장한다.
ALTER TABLE "tournaments" ADD COLUMN "prize_amount" DECIMAL(18,0);

CREATE TABLE "tournament_rank_prizes" (
    "id" BIGSERIAL NOT NULL,
    "tournament_id" BIGINT NOT NULL,
    "rank" INTEGER NOT NULL,
    "amount" DECIMAL(18,0) NOT NULL,
    CONSTRAINT "tournament_rank_prizes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tournament_rank_prizes_tournament_id_rank_key" ON "tournament_rank_prizes"("tournament_id", "rank");
ALTER TABLE "tournament_rank_prizes" ADD CONSTRAINT "tournament_rank_prizes_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
