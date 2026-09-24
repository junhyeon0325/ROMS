import { describe, expect, it } from "vitest";
import { EMPTY_SEASON_FILTERS, matchesSeasonFilters } from "@/lib/seasons/seasonFilters";
import type { SeasonItem } from "@/lib/types/seasons";

const season: SeasonItem = {
  id: "1", name: "러너리그 시즌4", status: "개최 예정", period: "2026-02-20 ~ 2026-02-27",
  startDate: "2026-02-20", endDate: "2026-02-27", prize: "20,000,000원", prizeAmount: "20000000",
  schedules: [{ name: "팀원 선정", startDate: "2026-02-20", endDate: "2026-02-21" }],
  rankPrizes: [{ rank: 1, amount: "10000000" }, { rank: 2, amount: "5000000" }],
  teamCount: 0, remarks: "방송 규칙 안내", createdAt: "", updatedAt: "",
};

describe("대회 조회 컬럼별 필터", () => {
  it("기본 조건과 각 컬럼의 일치 조건으로 조회한다", () => {
    expect(matchesSeasonFilters(season, EMPTY_SEASON_FILTERS)).toBe(true);
    const matching = {
      name: "시즌4", status: "개최 예정", startDate: "2026-02-20", endDate: "2026-02-27",
      prize: "20,000,000", scheduleCount: "1", rankPrizeCount: "2", remarks: "규칙",
    };
    expect(matchesSeasonFilters(season, matching)).toBe(true);
    for (const key of Object.keys(matching) as (keyof typeof matching)[]) {
      expect(matchesSeasonFilters(season, { ...matching, [key]: "불일치" })).toBe(false);
    }
  });

  it("숫자 필터는 부분 문자열 대신 정확한 금액과 건수를 비교한다", () => {
    expect(matchesSeasonFilters(season, { ...EMPTY_SEASON_FILTERS, prize: "2000000" })).toBe(false);
    expect(matchesSeasonFilters(season, { ...EMPTY_SEASON_FILTERS, scheduleCount: "0" })).toBe(false);
    expect(matchesSeasonFilters(season, { ...EMPTY_SEASON_FILTERS, rankPrizeCount: "2" })).toBe(true);
  });

  it("기존 문자열 상금도 금액 검색 대상으로 포함한다", () => {
    expect(matchesSeasonFilters({ ...season, prizeAmount: null }, { ...EMPTY_SEASON_FILTERS, prize: "20000000" })).toBe(true);
  });
});
