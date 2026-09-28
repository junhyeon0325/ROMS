// 시즌 팀 편성 서비스가 등록 참가자만 저장하고 기존 관계를 보존하는지 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    season: { findUnique: vi.fn() },
    seasonParticipant: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    seasonTeam: { findMany: vi.fn(), delete: vi.fn(), create: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    seasonTeamMember: { deleteMany: vi.fn(), createMany: vi.fn() },
    match: { count: vi.fn() }, matchSet: { count: vi.fn() }, heroBan: { count: vi.fn() },
  };
  return { tx, prisma: { seasonTeam: { findMany: vi.fn() }, $transaction: vi.fn() } };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/seasons/participantService", () => ({ findParticipants: vi.fn().mockResolvedValue([]) }));

import { saveSeasonDraft } from "@/lib/seasons/draftService";
import { findParticipants } from "@/lib/seasons/participantService";

describe("시즌 팀 편성 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findParticipants).mockResolvedValue([]);
    mocks.prisma.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(mocks.tx));
    mocks.tx.season.findUnique.mockResolvedValue({ id: BigInt(3) });
    mocks.tx.seasonParticipant.findMany.mockResolvedValue([{ streamerId: BigInt(1), roles: ["PLAYER"], position: "SUPPORT" }, { streamerId: BigInt(2), roles: ["COACH"], position: null }, { streamerId: BigInt(3), roles: ["CAPTAIN"], position: "TANK" }]);
    mocks.tx.seasonTeam.findMany.mockResolvedValue([]);
    mocks.tx.seasonTeam.create.mockResolvedValue({ id: BigInt(20) });
    mocks.prisma.seasonTeam.findMany.mockResolvedValue([]);
  });

  it("등록 선수와 감독을 같은 시즌 팀에 저장하고 감독 포지션은 비운다", async () => {
    await saveSeasonDraft(BigInt(3), { teams: [{ name: "팀장 팀", sortOrder: 1, members: ["3", "1", "2"] }], draftOrders: [{ streamerId: "1", order: 1 }, { streamerId: "2", order: null }, { streamerId: "3", order: null }] });
    expect(mocks.tx.seasonTeam.create).toHaveBeenCalledWith({ data: { seasonId: BigInt(3), name: "팀장 팀" } });
    expect(mocks.tx.seasonTeamMember.createMany).toHaveBeenCalledWith({ data: [
      { seasonId: BigInt(3), seasonTeamId: BigInt(20), streamerId: BigInt(3), position: "TANK" },
      { seasonId: BigInt(3), seasonTeamId: BigInt(20), streamerId: BigInt(1), position: "SUPPORT" },
      { seasonId: BigInt(3), seasonTeamId: BigInt(20), streamerId: BigInt(2), position: null },
    ] });
    expect(mocks.tx.seasonParticipant.updateMany).toHaveBeenCalledWith({ where: { seasonId: BigInt(3) }, data: { draftOrder: null } });
    expect(mocks.tx.seasonParticipant.update).toHaveBeenCalledTimes(1);
    expect(mocks.tx.seasonTeam.update).toHaveBeenCalledWith({ where: { id: BigInt(20) }, data: { sortOrder: 1 } });
  });

  it("기존 시즌 팀의 이름을 같은 행에서 변경한다", async () => {
    mocks.tx.seasonTeam.findMany.mockResolvedValue([{ id: BigInt(20), seasonId: BigInt(3), name: "기존 이름" }]);
    await saveSeasonDraft(BigInt(3), { teams: [{ id: "20", name: "변경 이름", sortOrder: 1, members: ["3"] }], draftOrders: [{ streamerId: "1", order: null }, { streamerId: "2", order: null }, { streamerId: "3", order: null }] });
    expect(mocks.tx.seasonTeam.update).toHaveBeenCalledWith({ where: { id: BigInt(20) }, data: { name: "변경 이름" } });
    expect(mocks.tx.seasonTeam.create).not.toHaveBeenCalled();
  });

  it("경기 기록이 있는 시즌 팀은 삭제 전에 중단한다", async () => {
    mocks.tx.seasonParticipant.findMany.mockResolvedValue([{ streamerId: BigInt(1), roles: ["PLAYER"], position: "SUPPORT" }]);
    mocks.tx.seasonTeam.findMany.mockResolvedValue([{ id: BigInt(20), seasonId: BigInt(3), name: "기존 팀" }]);
    mocks.tx.match.count.mockResolvedValue(1);
    mocks.tx.matchSet.count.mockResolvedValue(0);
    mocks.tx.heroBan.count.mockResolvedValue(0);
    await expect(saveSeasonDraft(BigInt(3), { teams: [], draftOrders: [{ streamerId: "1", order: null }] })).rejects.toMatchObject({ status: 409 });
    expect(mocks.tx.seasonTeam.delete).not.toHaveBeenCalled();
  });

  it("현재 시즌에 등록되지 않은 참가자가 있으면 기존 팀원을 삭제하지 않는다", async () => {
    await expect(saveSeasonDraft(BigInt(3), { teams: [{ name: "새 팀", sortOrder: 1, members: ["3", "9"] }], draftOrders: [{ streamerId: "1", order: null }, { streamerId: "2", order: null }, { streamerId: "3", order: null }] })).rejects.toMatchObject({ status: 409 });
    expect(mocks.tx.seasonTeamMember.deleteMany).not.toHaveBeenCalled();
  });

  it("감독에게 지명 순서를 저장하지 않는다", async () => {
    await expect(saveSeasonDraft(BigInt(3), { teams: [{ name: "팀장 팀", sortOrder: 1, members: ["3", "2"] }], draftOrders: [{ streamerId: "1", order: null }, { streamerId: "2", order: 1 }, { streamerId: "3", order: null }] })).rejects.toMatchObject({ status: 400 });
    expect(mocks.tx.seasonParticipant.updateMany).not.toHaveBeenCalled();
  });

  it("팀장이 없는 팀이나 한 팀의 중복 팀장을 저장하지 않는다", async () => {
    const orders = [{ streamerId: "1", order: null }, { streamerId: "2", order: null }, { streamerId: "3", order: null }];
    await expect(saveSeasonDraft(BigInt(3), { teams: [{ name: "빈 팀", sortOrder: 1, members: ["1"] }], draftOrders: orders })).rejects.toThrow("팀장");
    mocks.tx.seasonParticipant.findMany.mockResolvedValue([{ streamerId: BigInt(1), roles: ["PLAYER"], position: "SUPPORT" }, { streamerId: BigInt(2), roles: ["COACH"], position: null }, { streamerId: BigInt(3), roles: ["CAPTAIN"], position: "TANK" }, { streamerId: BigInt(4), roles: ["CAPTAIN"], position: "DAMAGE" }]);
    await expect(saveSeasonDraft(BigInt(3), { teams: [{ name: "첫 팀", sortOrder: 1, members: ["3", "4"] }, { name: "둘째 팀", sortOrder: 2, members: ["1"] }], draftOrders: [...orders, { streamerId: "4", order: null }] })).rejects.toThrow("팀장");
    expect(mocks.tx.seasonTeamMember.deleteMany).not.toHaveBeenCalled();
  });

  it("팀장 포함 5명과 딜러·힐러 각 2명 제한을 저장 전에 검사한다", async () => {
    mocks.tx.seasonParticipant.findMany.mockResolvedValue([
      { streamerId: BigInt(3), roles: ["CAPTAIN"], position: "TANK" },
      ...[1, 4, 5, 6, 7].map((id) => ({ streamerId: BigInt(id), roles: ["PLAYER"], position: id === 7 ? "SUPPORT" : "DAMAGE" })),
    ]);
    const draftOrders = [3, 1, 4, 5, 6, 7].map((id) => ({ streamerId: String(id), order: null }));
    await expect(saveSeasonDraft(BigInt(3), { teams: [{ name: "팀장 팀", sortOrder: 1, members: ["3", "1", "4", "5", "6", "7"] }], draftOrders })).rejects.toThrow("최대 5명");
    await expect(saveSeasonDraft(BigInt(3), { teams: [{ name: "팀장 팀", sortOrder: 1, members: ["3", "1", "4", "5"] }], draftOrders })).rejects.toThrow("딜러");
    expect(mocks.tx.seasonTeamMember.deleteMany).not.toHaveBeenCalled();
  });
});
