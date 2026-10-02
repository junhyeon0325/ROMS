// 통계 SQL이 시즌·교차 필터·페이지 제한을 DB에 적용하고 결과 ID를 직렬화하는지 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks }));

import { browseStatisticMatches, browseStatistics, type StatisticsQuery } from "@/lib/matches/statisticsService";

const base: StatisticsQuery = { seasonId: BigInt(4), tab: "players", page: 2, search: "선수", sort: "sets" };

// Prisma SQL의 매개변수와 안전하게 고정된 쿼리 구조를 함께 확인한다.
function queryAt(index: number) {
  return mocks.$queryRaw.mock.calls[index][0] as Prisma.Sql;
}

describe("경기 통계 조회", () => {
  beforeEach(() => {
    mocks.$queryRaw.mockImplementation(async (query: Prisma.Sql) => query.sql.includes("COUNT(*) AS total") || query.sql.includes("COUNT(DISTINCT m.id) AS total")
      ? [{ total: BigInt(21) }]
      : [{ id: BigInt(7), name: "선수", subtitle: "A", matches: 3, sets: 5, decided: 4, wins: 3, losses: 1, uses: 0 }]);
  });

  it("선수 집계에 시즌·팀·맵·영웅 조건과 20건 페이지를 적용한다", async () => {
    const result = await browseStatistics({ ...base, teamId: BigInt(2), mapId: BigInt(5), heroId: BigInt(9) });
    const sql = queryAt(1);
    expect(sql.sql).toContain("LIMIT ? OFFSET ?");
    expect(sql.sql).toContain("p.used_hero_ids");
    expect(sql.values).toEqual(expect.arrayContaining([BigInt(4), BigInt(2), BigInt(5), "9", "%선수%", 20, 20]));
    expect(result).toMatchObject({ total: 21, page: 2, rows: [{ id: "7", wins: 3, losses: 1 }] });
  });

  it("영웅 사용은 JSON 배열을 펼쳐 선수 기록당 한 번으로 센다", async () => {
    await browseStatistics({ ...base, tab: "heroes", search: "", sort: "uses", heroId: BigInt(9) });
    expect(queryAt(1).sql).toContain("jsonb_array_elements_text");
    expect(queryAt(1).sql).toContain("COUNT(DISTINCT u.stat_id)::int AS uses");
    expect(queryAt(1).sql).toContain("uses DESC");
    expect(queryAt(1).values).toContain("9");
  });

  it("상세 경기도 선택 항목과 시즌에 한정해 페이지 단위로 읽는다", async () => {
    mocks.$queryRaw.mockImplementation(async (query: Prisma.Sql) => query.sql.includes("COUNT(DISTINCT m.id) AS total")
      ? [{ total: BigInt(1) }]
      : [{ id: BigInt(8), matchDate: new Date("2026-02-22"), tournamentStage: "결승", teamA: "A", teamB: "B" }]);
    const result = await browseStatisticMatches({ ...base, detailId: BigInt(7) });
    expect(queryAt(1).sql).toContain("GROUP BY m.id");
    expect(queryAt(1).values).toEqual(expect.arrayContaining([BigInt(4), BigInt(7), 20, 20]));
    expect(result.rows[0]).toMatchObject({ id: "8", matchDate: "2026-02-22" });
  });
});
