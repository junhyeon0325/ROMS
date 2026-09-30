// 경기 저장 서비스의 대회 참조 검증과 세트 승수 반영을 확인한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchInput } from "@/lib/types/matches";

const mocks = vi.hoisted(() => {
  const tx = {
    season: { findUnique: vi.fn() },
    seasonTeam: { findMany: vi.fn() },
    seasonMap: { findMany: vi.fn() },
    seasonTeamMember: { findMany: vi.fn() },
    hero: { findMany: vi.fn() },
    match: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    matchSet: { findMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    heroBan: { findMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    playerSetStat: { findMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn(), create: vi.fn() },
  };
  return { tx, prisma: { $transaction: vi.fn(), match: { findFirstOrThrow: vi.fn() } } };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import { saveMatch, updateMatchSection } from "@/lib/matches/matchService";

const base: MatchInput = { seasonId: "1", tournamentStage: "결승", matchDate: "", teamAId: "10", teamBId: "20", bestOf: 3, remarks: "", sets: [] };
// 서비스 테스트에 사용할 완료 세트 입력을 만든다.
const completed = (setNumber: number, winnerTeamId: string) => ({ setNumber, mapId: "100", winnerTeamId, gameDurationSeconds: null, vodUrl: "", bans: [], stats: [] });

describe("경기 기록 저장 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(mocks.tx));
    mocks.tx.season.findUnique.mockResolvedValue({ id: BigInt(1) });
    mocks.tx.seasonTeam.findMany.mockResolvedValue([{ id: BigInt(10) }, { id: BigInt(20) }]);
    mocks.tx.seasonMap.findMany.mockResolvedValue([{ mapId: BigInt(100) }]);
    mocks.tx.seasonTeamMember.findMany.mockResolvedValue([]);
    mocks.tx.hero.findMany.mockResolvedValue([]);
    mocks.tx.match.create.mockResolvedValue({ id: BigInt(50) });
    mocks.tx.matchSet.create.mockResolvedValue({ id: BigInt(60) });
    mocks.tx.heroBan.findMany.mockResolvedValue([]);
    mocks.tx.playerSetStat.findMany.mockResolvedValue([]);
    mocks.prisma.match.findFirstOrThrow.mockResolvedValue({ id: BigInt(50), seasonId: BigInt(1), tournamentStage: "결승", matchDate: null, teamAId: BigInt(10), teamBId: BigInt(20), bestOf: 3, winnerTeamId: BigInt(10), remarks: null, teamA: { name: "A" }, teamB: { name: "B" }, sets: [] });
  });

  it("목표 승수에 도달한 팀을 경기 승리팀으로 저장한다", async () => {
    await saveMatch({ ...base, sets: [completed(1, "10"), completed(2, "20"), completed(3, "10")] }, "7");
    expect(mocks.tx.match.create).toHaveBeenCalledWith({ data: expect.objectContaining({ winnerTeamId: BigInt(10), bestOf: 3 }) });
    expect(mocks.tx.match.create).toHaveBeenCalledWith({ data: expect.objectContaining({ createdBy: "7", updatedBy: "7" }) });
    expect(mocks.tx.matchSet.create).toHaveBeenCalledTimes(3);
  });

  // 기존 밴의 작성자 정보는 보존하고 편집한 사용자만 수정자로 기록한다.
  it("기존 밴 수정자의 감사 필드", async () => {
    mocks.tx.hero.findMany.mockResolvedValue([{ id: BigInt(2000), role: "DAMAGE" }]);
    mocks.tx.heroBan.findMany.mockResolvedValue([{ id: BigInt(90), sortOrder: 1, createdBy: "5" }]);
    const firstSet = { ...completed(1, "10"), bans: [{ teamId: "20", heroId: "2000" }] };
    await saveMatch({ ...base, sets: [firstSet] }, "7");
    expect(mocks.tx.heroBan.update).toHaveBeenCalledWith({
      where: { id: BigInt(90) },
      data: { teamId: BigInt(20), heroId: BigInt(2000), sortOrder: 1, updatedBy: "7" },
    });
    expect(mocks.tx.heroBan.create).not.toHaveBeenCalled();
  });

  it("다른 대회의 팀은 경기 생성 전에 거절한다", async () => {
    mocks.tx.seasonTeam.findMany.mockResolvedValue([{ id: BigInt(10) }]);
    await expect(saveMatch(base, "7")).rejects.toThrow("해당 대회");
    expect(mocks.tx.match.create).not.toHaveBeenCalled();
  });

  it("승리 확정 뒤 완료 세트가 계속되면 경기 생성 전에 거절한다", async () => {
    await expect(saveMatch({ ...base, sets: [completed(1, "10"), completed(2, "10"), completed(3, "20")] }, "7")).rejects.toThrow("승리 확정 뒤");
    expect(mocks.tx.match.create).not.toHaveBeenCalled();
  });

  // 상세 저장이 선택한 세트만 쓰고 다른 세트의 기록은 현재 DB 값으로 보존하는지 비교한다.
  it("세트 상세 저장의 쓰기 범위를 전체 세트 저장과 비교한다", async () => {
    const row = { id: BigInt(50), seasonId: BigInt(1), tournamentStage: "결승", matchDate: null, teamAId: BigInt(10), teamBId: BigInt(20), bestOf: 3, winnerTeamId: null, remarks: null, teamA: { name: "A" }, teamB: { name: "B" }, sets: [1, 2, 3].map((number) => ({ id: BigInt(60 + number), setNumber: number, mapId: BigInt(100), mapSubareaId: null, mapSubarea: null, mapSubareaResults: null, teamAColor: "BLUE", hybridFirstAttackTeamId: null, hybridTurnResults: null, winnerTeamId: null, gameDurationSeconds: null, vodUrl: null, heroBans: [], playerStats: [] })) };
    mocks.tx.match.findUnique.mockResolvedValue(row);
    mocks.tx.matchSet.findMany.mockResolvedValue(row.sets.map((set) => ({ id: set.id })));
    mocks.tx.matchSet.update.mockImplementation(({ where }: { where: { id: bigint } }) => Promise.resolve({ id: where.id }));
    mocks.prisma.match.findFirstOrThrow.mockResolvedValue(row);
    const sets = row.sets.map((set) => ({ ...completed(set.setNumber, "10"), id: String(set.id), winnerTeamId: null, vodUrl: set.setNumber === 2 ? "https://example.com/vod" : "" }));
    await updateMatchSection(BigInt(50), "sets", { sets }, "7");
    const before = mocks.tx.matchSet.update.mock.calls.length;
    mocks.tx.matchSet.update.mockClear();
    mocks.tx.matchSet.deleteMany.mockClear();
    await updateMatchSection(BigInt(50), "setDetail", { set: sets[1] }, "7");
    expect(before).toBe(3);
    expect(mocks.tx.matchSet.update).toHaveBeenCalledTimes(1);
    expect(mocks.tx.matchSet.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: BigInt(62) } }));
    expect(mocks.tx.matchSet.deleteMany).not.toHaveBeenCalled();
  });
});
