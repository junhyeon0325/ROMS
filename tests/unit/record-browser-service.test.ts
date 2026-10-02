// 경기 기록 조회가 서버 필터·페이지 제한을 적용하고 상세를 선택 경기로 한정하는지 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  match: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  seasonTeam: { findMany: vi.fn() },
  matchSet: { findMany: vi.fn() },
  mapItem: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mocks }));

import { browseMatchRecords, findRecordDetail, findRecordFilters } from "@/lib/matches/recordBrowserService";

describe("경기 기록 조회", () => {
  beforeEach(() => {
    mocks.match.count.mockResolvedValue(21);
    mocks.match.findMany.mockResolvedValue([{
      id: BigInt(7), seasonId: BigInt(4), tournamentStage: "결승", matchDate: new Date("2026-02-22"),
      bestOf: 3, winnerTeamId: BigInt(1),
      teamA: { id: BigInt(1), name: "A" }, teamB: { id: BigInt(2), name: "B" },
      sets: [{ id: BigInt(10), setNumber: 1, winnerTeamId: BigInt(1), map: { id: BigInt(5), name: "도라도", mapType: "ESCORT" } }],
    }]);
  });

  it("대회·팀·맵·세트 조건과 20건 페이지를 DB 조회에 적용한다", async () => {
    const result = await browseMatchRecords({ seasonId: BigInt(4), page: 2, search: "결승", teamId: BigInt(1), mapId: BigInt(5), setNumber: 1, sort: "dateDesc" });
    expect(mocks.match.count.mock.calls[0][0].where).toMatchObject({ seasonId: BigInt(4), OR: [{ teamAId: BigInt(1) }, { teamBId: BigInt(1) }], sets: { some: { mapId: BigInt(5), setNumber: 1 } } });
    expect(mocks.match.findMany.mock.calls[0][0]).toMatchObject({ skip: 20, take: 20 });
    expect(result.rows[0]).toMatchObject({ id: "7", scoreA: 1, scoreB: 0 });
    expect(result.rows[0].sets[0].map?.name).toBe("도라도");
  });

  it("실제 사용 맵만 필터 선택지로 조회한다", async () => {
    mocks.seasonTeam.findMany.mockResolvedValue([{ id: BigInt(1), name: "A" }]);
    mocks.matchSet.findMany.mockResolvedValue([{ mapId: BigInt(5) }]);
    mocks.mapItem.findMany.mockResolvedValue([{ id: BigInt(5), name: "도라도", mapType: "ESCORT" }]);
    const result = await findRecordFilters(BigInt(4));
    expect(mocks.matchSet.findMany.mock.calls[0][0].where).toMatchObject({ match: { seasonId: BigInt(4) } });
    expect(mocks.mapItem.findMany.mock.calls[0][0].where.id.in).toEqual([BigInt(5)]);
    expect(result.maps[0].id).toBe("5");
  });

  it("상세 조회는 시즌과 경기 ID를 동시에 확인한다", async () => {
    mocks.match.findFirst.mockResolvedValue(null);
    expect(await findRecordDetail(BigInt(4), BigInt(7))).toBeNull();
    expect(mocks.match.findFirst.mock.calls[0][0].where).toEqual({ id: BigInt(7), seasonId: BigInt(4) });
  });
});
