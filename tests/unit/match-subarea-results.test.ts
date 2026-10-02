// 구역 결과와 사용 영웅이 저장 응답 및 재조회에서 함께 복원되는지 확인한다.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    season: { findUnique: vi.fn() },
    seasonTeam: { findMany: vi.fn() },
    seasonMap: { findMany: vi.fn() },
    mapSubarea: { findMany: vi.fn() },
    seasonTeamMember: { findMany: vi.fn() },
    hero: { findMany: vi.fn() },
    match: { findUnique: vi.fn(), update: vi.fn() },
    matchSet: { findMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn() },
    heroBan: { findMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    playerSetStat: { findMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn() },
  };
  return { tx, prisma: { $transaction: vi.fn(), match: { findFirst: vi.fn(), findFirstOrThrow: vi.fn() } } };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import { findMatch, updateMatchSection } from "@/lib/matches/matchService";

// 실제 Prisma 조회 형태의 세트 행을 만들어 JSON 저장·복원 경로를 검사한다.
function makeMatchRow() {
  return {
    id: BigInt(50), seasonId: BigInt(1), tournamentStage: "결승", matchDate: null,
    teamAId: BigInt(10), teamBId: BigInt(20), bestOf: 3, winnerTeamId: null, remarks: null,
    teamA: { name: "A팀" }, teamB: { name: "B팀" },
    sets: [{
      id: BigInt(60), setNumber: 1, mapId: BigInt(100), mapSubareaId: null,
      mapSubareaResults: null as string | null, mapSubarea: null,
      hybridFirstAttackTeamId: null as bigint | null, hybridTurnResults: null as string | null,
      teamAPushDistanceMeters: null as number | null, teamBPushDistanceMeters: null as number | null,
      escortFirstAttackTeamId: null as bigint | null,
      escortTurnResults: null as string | null,
      teamAEscortDistanceMeters: null as number | null, teamBEscortDistanceMeters: null as number | null,
      teamAEscortScore: null as number | null, teamBEscortScore: null as number | null,
      teamAColor: "BLUE", winnerTeamId: null, gameDurationSeconds: null, vodUrl: null,
      heroBans: [],
      playerStats: [{
        id: BigInt(70), streamerId: BigInt(7), kills: 0, deaths: 0, assists: 0,
        damage: 0, healing: 0, mitigatedDamage: 0,
        usedHeroIds: '["2000"]', usedHeroSubareas: '{"2000":["1000"]}', usedHeroTurns: null as string | null,
        lineupOrder: null, isPotg: false,
      }],
    }],
  };
}

describe("구역 결과 저장과 재조회", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(mocks.tx));
    mocks.tx.season.findUnique.mockResolvedValue({ id: BigInt(1) });
    mocks.tx.seasonTeam.findMany.mockResolvedValue([{ id: BigInt(10) }, { id: BigInt(20) }]);
    mocks.tx.seasonMap.findMany.mockResolvedValue([{ mapId: BigInt(100) }]);
    mocks.tx.mapSubarea.findMany.mockResolvedValue([{ id: BigInt(1000), mapId: BigInt(100) }]);
    mocks.tx.seasonTeamMember.findMany.mockResolvedValue([{ streamerId: BigInt(7) }]);
    mocks.tx.hero.findMany.mockResolvedValue([{ id: BigInt(2000), role: "DAMAGE" }]);
    mocks.tx.matchSet.findMany.mockResolvedValue([{ id: BigInt(60) }]);
    mocks.tx.heroBan.findMany.mockResolvedValue([]);
    mocks.tx.match.update.mockResolvedValue({ id: BigInt(50) });
    mocks.tx.matchSet.update.mockResolvedValue({ id: BigInt(60) });
    mocks.tx.playerSetStat.findMany.mockResolvedValue([{ id: BigInt(70), streamerId: BigInt(7) }]);
  });

  it("구역 승리 팀·양 팀 점유율·점수와 색상 배정을 저장하고 다시 조회해도 유지한다", async () => {
    const row = makeMatchRow();
    mocks.tx.match.findUnique.mockResolvedValue(row);
    mocks.prisma.match.findFirstOrThrow.mockImplementation(async () => row);
    mocks.prisma.match.findFirst.mockImplementation(async () => row);
    mocks.tx.matchSet.update.mockImplementation(async ({ data }: { data: { mapSubareaResults: string; teamAColor: string } }) => {
      row.sets[0].mapSubareaResults = data.mapSubareaResults;
      row.sets[0].teamAColor = data.teamAColor;
      return { id: BigInt(60) };
    });

    const current = await findMatch(BigInt(1), BigInt(50));
    expect(current).not.toBeNull();
    const result = { order: 0, teamAScore: 1, teamBScore: 0, teamAProgress: 76, teamBProgress: 99, winnerTeamId: "10" };
    const set = { ...current!.sets[0], teamAColor: "RED" as const, mapSubareaResults: { "1000": result } };
    const saved = await updateMatchSection(BigInt(50), "setDetail", { set }, "7");
    const reopened = await findMatch(BigInt(1), BigInt(50));

    expect(JSON.parse(row.sets[0].mapSubareaResults!)).toEqual({ "1000": result });
    expect(saved.sets[0].mapSubareaResults).toEqual({ "1000": result });
    expect(reopened?.sets[0].mapSubareaResults).toEqual({ "1000": result });
    expect(saved.sets[0].teamAColor).toBe("RED");
    expect(reopened?.sets[0].teamAColor).toBe("RED");
    expect(reopened?.sets[0].stats[0].usedHeroIds).toEqual(["2000"]);
    expect(reopened?.sets[0].stats[0].usedHeroSubareas).toEqual({ "2000": ["1000"] });
    expect(mocks.tx.playerSetStat.update).toHaveBeenCalledWith({
      where: { id: BigInt(70) }, data: expect.objectContaining({ usedHeroIds: '["2000"]', usedHeroSubareas: '{"2000":["1000"]}' }),
    });
  });
  // 혼합맵의 두 공격 턴과 선수 영웅은 JSON 저장 뒤 재조회해도 구분된다.
  it("혼합맵 턴별 기록 재조회", async () => {
    const row = makeMatchRow();
    row.sets[0].playerStats[0].usedHeroSubareas = "{}";
    mocks.tx.seasonMap.findMany.mockResolvedValue([{ mapId: BigInt(100), map: { mapType: "HYBRID" } }]);
    mocks.tx.mapSubarea.findMany.mockResolvedValue([]);
    mocks.tx.match.findUnique.mockResolvedValue(row);
    mocks.prisma.match.findFirstOrThrow.mockImplementation(async () => row);
    mocks.prisma.match.findFirst.mockImplementation(async () => row);
    mocks.tx.matchSet.update.mockImplementation(async ({ data }: { data: { hybridFirstAttackTeamId: bigint; hybridTurnResults: string } }) => {
      row.sets[0].hybridFirstAttackTeamId = data.hybridFirstAttackTeamId;
      row.sets[0].hybridTurnResults = data.hybridTurnResults;
      return { id: BigInt(60) };
    });
    mocks.tx.playerSetStat.update.mockImplementation(async ({ data }: { data: { usedHeroTurns: string } }) => {
      row.sets[0].playerStats[0].usedHeroTurns = data.usedHeroTurns;
      return { id: BigInt(70) };
    });

    const current = await findMatch(BigInt(1), BigInt(50));
    const set = { ...current!.sets[0], hybridFirstAttackTeamId: "10", hybridTurnResults: { "10": { points: 2, progressPercent: 75, captureProgressPercent: 63, payloadDistanceMeters: 128.45 }, "20": { points: 1, progressPercent: 40, captureProgressPercent: 0, payloadDistanceMeters: 0 }, "turn-3": { attackTeamId: "10", points: 3, progressPercent: 85 }, "turn-4": { attackTeamId: "20", points: 0, progressPercent: 12 } }, stats: current!.sets[0].stats.map((stat) => ({ ...stat, usedHeroTurns: { "10": ["2000"], "20": ["2000"], "turn-3": ["2000"], "turn-4": ["2000"] } })) };
    const saved = await updateMatchSection(BigInt(50), "setDetail", { set }, "7");
    const reopened = await findMatch(BigInt(1), BigInt(50));

    expect(saved.sets[0].hybridFirstAttackTeamId).toBe("10");
    expect(reopened?.sets[0].hybridTurnResults?.["20"]).toEqual({ points: 1, progressPercent: 40, captureProgressPercent: 0, payloadDistanceMeters: 0 });
    expect(reopened?.sets[0].hybridTurnResults?.["10"]).toEqual({ points: 2, progressPercent: 75, captureProgressPercent: 63, payloadDistanceMeters: 128.45 });
    expect(JSON.parse(row.sets[0].hybridTurnResults!)["10"]).toEqual(reopened?.sets[0].hybridTurnResults?.["10"]);
    expect(reopened?.sets[0].hybridTurnResults?.["turn-3"]).toEqual({ attackTeamId: "10", points: 3, progressPercent: 85 });
    expect(reopened?.sets[0].hybridTurnResults?.["turn-4"]).toEqual({ attackTeamId: "20", points: 0, progressPercent: 12 });
    expect(reopened?.sets[0].stats[0].usedHeroTurns).toEqual({ "10": ["2000"], "20": ["2000"], "turn-3": ["2000"], "turn-4": ["2000"] });
    expect(mocks.tx.matchSet.update).toHaveBeenCalledWith({ where: { id: BigInt(60) }, data: expect.objectContaining({ updatedBy: "7" }) });
    expect(mocks.tx.playerSetStat.update).toHaveBeenCalledWith({ where: { id: BigInt(70) }, data: expect.objectContaining({ updatedBy: "7" }) });
  });

  // PUSH 맵의 팀별 최종 거리가 저장과 재조회에서 숫자로 유지되는지 확인한다.
  it("밀기 맵 팀별 거리 저장 및 재조회", async () => {
    const row = makeMatchRow();
    row.sets[0].playerStats[0].usedHeroSubareas = "{}";
    mocks.tx.seasonMap.findMany.mockResolvedValue([{ mapId: BigInt(100), map: { mapType: "PUSH" } }]);
    mocks.tx.mapSubarea.findMany.mockResolvedValue([]);
    mocks.tx.match.findUnique.mockResolvedValue(row);
    mocks.prisma.match.findFirstOrThrow.mockImplementation(async () => row);
    mocks.prisma.match.findFirst.mockImplementation(async () => row);
    mocks.tx.matchSet.update.mockImplementation(async ({ data }: { data: { teamAPushDistanceMeters: number | null; teamBPushDistanceMeters: number | null } }) => {
      row.sets[0].teamAPushDistanceMeters = data.teamAPushDistanceMeters;
      row.sets[0].teamBPushDistanceMeters = data.teamBPushDistanceMeters;
      return { id: BigInt(60) };
    });

    const current = await findMatch(BigInt(1), BigInt(50));
    const set = { ...current!.sets[0], teamAPushDistanceMeters: 95.06, teamBPushDistanceMeters: 135.99 };
    const saved = await updateMatchSection(BigInt(50), "setDetail", { set }, "7");
    const reopened = await findMatch(BigInt(1), BigInt(50));

    expect(saved.sets[0]).toMatchObject({ teamAPushDistanceMeters: 95.06, teamBPushDistanceMeters: 135.99 });
    expect(reopened?.sets[0]).toMatchObject({ teamAPushDistanceMeters: 95.06, teamBPushDistanceMeters: 135.99 });
  });

  // 호위 세트의 추가 공격 턴과 선수 영웅이 DB 저장 뒤에도 분리되어 복원되는지 확인한다.
  it("호위 맵의 세 공격 턴과 턴별 영웅을 저장하고 다시 조회한다", async () => {
    const row = makeMatchRow();
    row.sets[0].playerStats[0].usedHeroSubareas = "{}";
    mocks.tx.seasonMap.findMany.mockResolvedValue([{ mapId: BigInt(100), map: { mapType: "ESCORT" } }]);
    mocks.tx.mapSubarea.findMany.mockResolvedValue([]);
    mocks.tx.match.findUnique.mockResolvedValue(row);
    mocks.prisma.match.findFirstOrThrow.mockImplementation(async () => row);
    mocks.prisma.match.findFirst.mockImplementation(async () => row);
    mocks.tx.matchSet.update.mockImplementation(async ({ data }: { data: { escortFirstAttackTeamId: bigint | null; escortTurnResults: string; teamAEscortScore: number | null; teamBEscortScore: number | null; teamAEscortDistanceMeters: number | null; teamBEscortDistanceMeters: number | null } }) => {
      row.sets[0].escortFirstAttackTeamId = data.escortFirstAttackTeamId;
      row.sets[0].escortTurnResults = data.escortTurnResults;
      row.sets[0].teamAEscortScore = data.teamAEscortScore;
      row.sets[0].teamBEscortScore = data.teamBEscortScore;
      row.sets[0].teamAEscortDistanceMeters = data.teamAEscortDistanceMeters;
      row.sets[0].teamBEscortDistanceMeters = data.teamBEscortDistanceMeters;
      return { id: BigInt(60) };
    });
    mocks.tx.playerSetStat.update.mockImplementation(async ({ data }: { data: { usedHeroTurns: string } }) => {
      row.sets[0].playerStats[0].usedHeroTurns = data.usedHeroTurns;
      return { id: BigInt(70) };
    });

    const current = await findMatch(BigInt(1), BigInt(50));
    const escortTurnResults = { "20": { points: 3, payloadDistanceMeters: 135.99 }, "10": { points: 2, payloadDistanceMeters: 95.06 }, "turn-3": { attackTeamId: "20", points: 4, payloadDistanceMeters: 151.2 } };
    const set = { ...current!.sets[0], escortFirstAttackTeamId: "20", escortTurnResults, stats: current!.sets[0].stats.map((stat) => ({ ...stat, usedHeroTurns: { "20": ["2000"], "10": ["2000"], "turn-3": ["2000"] } })) };
    const saved = await updateMatchSection(BigInt(50), "setDetail", { set }, "7");
    const reopened = await findMatch(BigInt(1), BigInt(50));

    expect(saved.sets[0].escortTurnResults).toEqual(escortTurnResults);
    expect(reopened?.sets[0].escortTurnResults).toEqual(escortTurnResults);
    expect(reopened?.sets[0].stats[0].usedHeroTurns).toEqual({ "20": ["2000"], "10": ["2000"], "turn-3": ["2000"] });
    expect(reopened?.sets[0]).toMatchObject({ teamAEscortScore: 2, teamBEscortScore: 4, teamAEscortDistanceMeters: 95.06, teamBEscortDistanceMeters: 151.2 });
  });
});
