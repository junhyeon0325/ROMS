// Prisma 대회 레코드를 관리자 화면의 대회 형식으로 변환한다.
import type {
  Season,
  SeasonSchedule as DbSchedule,
  SeasonRankPrize as DbRankPrize,
} from "@prisma/client";
import type { SeasonItem } from "@/lib/types/seasons";
import { formatMoneyInput, parseLegacyPrize } from "@/lib/seasons/money";

// 기존 일정의 시각은 한국 표준시 날짜로 표시하고 등록 기간은 UTC 날짜로 직렬화한다.
export function toKstDate(value: Date | null): string | null {
  return value
    ? new Date(value.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : null;
}

// 시즌과 세부 일정, 상금을 관리자 화면의 조회 형식으로 변환한다.
export function formatSeasonDto(
  item: Season & {
    schedules: DbSchedule[];
    rankPrizes: DbRankPrize[];
    _count: { seasonTeams: number };
  },
): SeasonItem {
  const startDate = item.startDate?.toISOString().slice(0, 10) ?? "";
  const endDate = item.endDate?.toISOString().slice(0, 10) ?? "";
  const prizeAmount =
    item.prizeAmount?.toFixed(0) ?? parseLegacyPrize(item.prize);
  return {
    id: item.id.toString(),
    name: item.name,
    status: item.status as SeasonItem["status"],
    startDate,
    endDate,
    period:
      startDate && endDate
        ? `${startDate.replaceAll("-", ".")} ~ ${endDate.replaceAll("-", ".")}`
        : "미정",
    teamCount: item._count.seasonTeams,
    prize: item.prizeAmount
      ? `${formatMoneyInput(prizeAmount!)}원`
      : item.prize,
    prizeAmount,
    remarks: item.remarks ?? "",
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    schedules: item.schedules.map((schedule) => ({
      id: schedule.id.toString(),
      name: schedule.name,
      startDate: toKstDate(schedule.startAt),
      endDate: toKstDate(schedule.endAt),
    })),
    rankPrizes: item.rankPrizes.map((rankPrize) => ({
      rank: rankPrize.rank,
      amount: rankPrize.amount.toFixed(0),
    })),
  };
}
