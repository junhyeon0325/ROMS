import type { SeasonItem } from "@/lib/types/seasons";
import { parseLegacyPrize } from "@/lib/seasons/money";

export interface SeasonFilters {
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  prize: string;
  scheduleCount: string;
  rankPrizeCount: string;
  remarks: string;
}

export const EMPTY_SEASON_FILTERS: SeasonFilters = {
  name: "", status: "ALL", startDate: "", endDate: "", prize: "",
  scheduleCount: "", rankPrizeCount: "", remarks: "",
};

// 목록에 표시하는 여덟 컬럼의 조건을 모두 만족하는 대회만 조회한다.
export function matchesSeasonFilters(item: SeasonItem, filters: SeasonFilters): boolean {
  const prizeQuery = filters.prize.trim().replaceAll(",", "");
  const savedPrize = item.prizeAmount ?? parseLegacyPrize(item.prize);
  const matchesPrize = !prizeQuery || (/^\d+$/.test(prizeQuery)
    ? savedPrize !== null && BigInt(savedPrize) === BigInt(prizeQuery)
    : item.prize.toLowerCase().includes(filters.prize.trim().toLowerCase()));

  return item.name.toLowerCase().includes(filters.name.trim().toLowerCase())
    && (filters.status === "ALL" || item.status === filters.status)
    && (!filters.startDate || item.startDate === filters.startDate)
    && (!filters.endDate || item.endDate === filters.endDate)
    && matchesPrize
    && (!filters.scheduleCount.trim() || String(item.schedules.length) === filters.scheduleCount.trim())
    && (!filters.rankPrizeCount.trim() || String(item.rankPrizes.length) === filters.rankPrizeCount.trim())
    && item.remarks.toLowerCase().includes(filters.remarks.trim().toLowerCase());
}
