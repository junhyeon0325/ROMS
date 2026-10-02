// 조합별 집계가 세트 사용·확정 승패·필터·페이지를 SQL에 적용하는지 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks }));

import { browsePlayerMapHeroStatistics, findPlayerMapHeroFilters } from "@/lib/matches/playerMapHeroStatisticsService";

describe("선수별 맵·영웅 집계", () => {
  beforeEach(() => {
    mocks.$queryRaw.mockReset();
    mocks.$queryRaw.mockImplementation(async (query: Prisma.Sql) => query.sql.includes("COUNT(*) AS total")
      ? [{ total: BigInt(21) }]
      : [{ player_id: BigInt(2), player_name: "선수", map_id: BigInt(3), map_name: "맵", hero_id: BigInt(4), hero_name: "영웅", uses: 5, matches: 3, sets: 5, wins: 2, losses: 1 }]);
  });

  it("선수·맵·영웅 필터와 중복 없는 사용·승패를 DB에서 집계해 한 페이지를 반환한다", async () => {
    const result = await browsePlayerMapHeroStatistics({ seasonId: BigInt(5), playerId: BigInt(2), mapId: BigInt(3), heroId: BigInt(4), search: "영웅", sort: "rate", page: 2 });
    const query = mocks.$queryRaw.mock.calls[1][0] as Prisma.Sql;
    expect(query.sql).toContain("SELECT DISTINCT p.streamer_id");
    expect(query.sql).toContain("COUNT(DISTINCT u.set_id)::int AS uses");
    expect(query.sql).toContain("u.team_id IS NOT NULL AND u.winner_team_id = u.team_id");
    expect(query.sql).toContain("LIMIT ? OFFSET ?");
    expect(query.values).toEqual(expect.arrayContaining([BigInt(5), BigInt(2), BigInt(3), "4", "%영웅%", 20, 20]));
    expect(result).toMatchObject({ total: 21, page: 2, rows: [{ playerId: "2", mapId: "3", heroId: "4", uses: 5, wins: 2, losses: 1 }] });
  });

  it("필터 선택지는 실제 영웅 사용이 있는 기록에서만 읽는다", async () => {
    mocks.$queryRaw.mockResolvedValue([{ id: BigInt(7), name: "항목" }]);
    const result = await findPlayerMapHeroFilters(BigInt(5));
    expect(result.players).toEqual([{ id: "7", name: "항목" }]);
    for (const [query] of mocks.$queryRaw.mock.calls as [Prisma.Sql][]) {
      expect(query.sql).toContain("jsonb_array_elements_text");
      expect(query.values).toContain(BigInt(5));
    }
  });
});
