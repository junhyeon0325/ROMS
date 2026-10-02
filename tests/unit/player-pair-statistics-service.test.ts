// 선수·맵과 선수·영웅 집계의 대상 세트와 승패 기준이 서로 다르게 적용되는지 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks }));

import { browsePlayerPairStatistics, findPlayerPairFilters } from "@/lib/matches/playerPairStatisticsService";

describe("선수별 맵·영웅 개별 통계", () => {
  beforeEach(() => {
    mocks.$queryRaw.mockReset();
    mocks.$queryRaw.mockImplementation(async (query: Prisma.Sql) => query.sql.includes("COUNT(*) AS total")
      ? [{ total: BigInt(25) }]
      : [{ player_id: BigInt(2), player_name: "선수", item_id: BigInt(3), item_name: "항목", uses: 5, matches: 3, sets: 5, wins: 2, losses: 1 }]);
  });

  it("맵 통계는 영웅 기록 없이 맵이 지정된 선수 세트를 집계한다", async () => {
    const result = await browsePlayerPairStatistics({ kind: "map", seasonId: BigInt(5), playerId: BigInt(2), itemId: BigInt(3), search: "항목", sort: "uses", page: 2 });
    const query = mocks.$queryRaw.mock.calls[1][0] as Prisma.Sql;
    expect(query.sql).toContain("ms.map_id IS NOT NULL");
    expect(query.sql).toContain("JOIN maps catalog");
    expect(query.sql).not.toContain("jsonb_array_elements_text");
    expect(query.sql).toContain("COUNT(DISTINCT u.set_id)::int AS uses");
    expect(query.sql).toContain("LIMIT ? OFFSET ?");
    expect(query.values).toEqual(expect.arrayContaining([BigInt(5), BigInt(2), BigInt(3), "%항목%", 20, 20]));
    expect(result).toMatchObject({ total: 25, page: 2, rows: [{ playerId: "2", itemId: "3", wins: 2, losses: 1 }] });
  });

  it("영웅 통계는 맵 미지정 세트도 포함하고 영웅별 사용을 한 번만 센다", async () => {
    await browsePlayerPairStatistics({ kind: "hero", seasonId: BigInt(5), itemId: BigInt(9), search: "", sort: "rate", page: 1 });
    const query = mocks.$queryRaw.mock.calls[1][0] as Prisma.Sql;
    expect(query.sql).toContain("jsonb_array_elements_text");
    expect(query.sql).toContain("JOIN heroes catalog");
    expect(query.sql).not.toContain("ms.map_id IS NOT NULL");
    expect(query.sql).toContain("COUNT(DISTINCT u.set_id) FILTER (WHERE u.team_id IS NOT NULL AND u.winner_team_id = u.team_id)");
    expect(query.values).toContain("9");
  });

  it("필터 선택지도 선택한 집계 기준의 실제 조합에서만 읽는다", async () => {
    mocks.$queryRaw.mockResolvedValue([{ id: BigInt(7), name: "항목" }]);
    const result = await findPlayerPairFilters("map", BigInt(5));
    expect(result).toEqual({ players: [{ id: "7", name: "항목" }], items: [{ id: "7", name: "항목" }] });
    for (const [query] of mocks.$queryRaw.mock.calls as [Prisma.Sql][]) {
      expect(query.sql).toContain("FROM stats ORDER BY name");
      expect(query.values).toContain(BigInt(5));
    }
  });
});
