// 대회 참가자 등록의 중복 방지, 역할 검증, 대회별 영속 조회를 확인한다.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    commonCode: { findMany: vi.fn() },
    season: { findUnique: vi.fn() }, streamer: { findMany: vi.fn() },
    seasonParticipant: { findMany: vi.fn(), createMany: vi.fn(), updateMany: vi.fn() },
  };
  return { tx, prisma: { commonCode: { findMany: vi.fn() }, seasonParticipant: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() }, $transaction: vi.fn() } };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
import { addParticipants, findParticipants, ParticipantError, updateParticipantRoles, updateParticipants } from "@/lib/seasons/participantService";

const stored = (streamerId: bigint, roles = ["PLAYER"]) => ({
  id: streamerId, seasonId: BigInt(7), streamerId, roles, position: "TANK", createdAt: new Date("2026-09-24T00:00:00Z"),
  streamer: { name: `선수${streamerId}`, profileImageUrl: null, chzzkChannelId: null },
});

describe("대회 참가자 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx));
    const findCodes = ({ where }: { where: { groupCode: string } }) => Promise.resolve(where.groupCode === "PLAYER_POSITION" ? [{ code: "TANK" }, { code: "DAMAGE" }, { code: "SUPPORT" }] : [{ code: "PLAYER" }, { code: "CAPTAIN" }, { code: "COACH" }]);
    mocks.prisma.commonCode.findMany.mockImplementation(findCodes);
    mocks.tx.commonCode.findMany.mockImplementation(findCodes);
    mocks.tx.season.findUnique.mockResolvedValue({ id: BigInt(7) });
    mocks.tx.streamer.findMany.mockResolvedValue([{ id: BigInt(1) }, { id: BigInt(2) }]);
    mocks.tx.seasonParticipant.findMany.mockResolvedValue([]);
  });

  it("여러 명을 팀 없이 등록하고 역할 코드를 저장한 뒤 대회별로 다시 조회한다", async () => {
    mocks.tx.seasonParticipant.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([stored(BigInt(1), ["PLAYER", "CAPTAIN"]), stored(BigInt(2), ["PLAYER", "CAPTAIN"])]);
    const created = await addParticipants(BigInt(7), [BigInt(1), BigInt(2)], ["PLAYER", "CAPTAIN"], { "1": "TANK", "2": "SUPPORT" });
    expect(created).toHaveLength(2);
    expect(mocks.tx.seasonParticipant.createMany).toHaveBeenCalledWith({ data: [{ seasonId: BigInt(7), streamerId: BigInt(1), roles: ["PLAYER", "CAPTAIN"], position: "TANK" }, { seasonId: BigInt(7), streamerId: BigInt(2), roles: ["PLAYER", "CAPTAIN"], position: "SUPPORT" }] });
    mocks.prisma.seasonParticipant.findMany.mockResolvedValue([stored(BigInt(1), ["PLAYER", "CAPTAIN"])]);
    expect(await findParticipants(BigInt(7))).toMatchObject([{ seasonId: "7", streamerId: "1", roles: ["PLAYER", "CAPTAIN"], position: "TANK" }]);
    expect(mocks.prisma.seasonParticipant.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { seasonId: BigInt(7) } }));
  });

  it("같은 요청의 중복 스트리머와 기존 등록 스트리머를 거부한다", async () => {
    await expect(addParticipants(BigInt(7), [BigInt(1), BigInt(1)], ["PLAYER"], { "1": "TANK" })).rejects.toMatchObject({ status: 400 });
    mocks.tx.streamer.findMany.mockResolvedValue([{ id: BigInt(1) }]);
    mocks.tx.seasonParticipant.findMany.mockResolvedValue([{ streamerId: BigInt(1) }]);
    await expect(addParticipants(BigInt(7), [BigInt(1)], ["PLAYER"], { "1": "TANK" })).rejects.toMatchObject({ status: 409 });
    expect(mocks.tx.seasonParticipant.createMany).not.toHaveBeenCalled();
  });

  it("활성 공통코드에 없는 역할과 빈 역할을 거부한다", async () => {
    await expect(addParticipants(BigInt(7), [BigInt(1)], ["UNKNOWN"], { "1": "TANK" })).rejects.toBeInstanceOf(ParticipantError);
    await expect(addParticipants(BigInt(7), [BigInt(1)], [], { "1": "TANK" })).rejects.toMatchObject({ status: 400 });
    await expect(addParticipants(BigInt(7), [BigInt(1)], ["PLAYER"], { "1": "UNKNOWN" })).rejects.toMatchObject({ status: 400 });
    await expect(addParticipants(BigInt(7), [BigInt(1)], ["PLAYER"], {})).rejects.toMatchObject({ status: 400 });
    expect(mocks.tx.seasonParticipant.createMany).not.toHaveBeenCalled();
  });

  it("감독 역할은 포지션 없이 등록하고 포지션 입력이 있으면 거부한다", async () => {
    mocks.tx.streamer.findMany.mockResolvedValue([{ id: BigInt(1) }]);
    mocks.tx.seasonParticipant.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([stored(BigInt(1), ["COACH"])]);
    await addParticipants(BigInt(7), [BigInt(1)], ["COACH"], { "1": null });
    expect(mocks.tx.seasonParticipant.createMany).toHaveBeenCalledWith({ data: [{ seasonId: BigInt(7), streamerId: BigInt(1), roles: ["COACH"], position: null }] });
    await expect(addParticipants(BigInt(7), [BigInt(2)], ["COACH"], { "2": "TANK" })).rejects.toMatchObject({ status: 400 });
  });

  it("선택한 대회의 참가자 포지션과 역할을 수정한다", async () => {
    mocks.prisma.seasonParticipant.findUnique.mockResolvedValue({ id: BigInt(9) });
    mocks.prisma.seasonParticipant.update.mockResolvedValue(stored(BigInt(1), ["CAPTAIN"]));
    expect((await updateParticipantRoles(BigInt(7), BigInt(1), ["CAPTAIN"], "DAMAGE")).roles).toEqual(["CAPTAIN"]);
    expect(mocks.prisma.seasonParticipant.findUnique).toHaveBeenCalledWith({ where: { seasonId_streamerId: { seasonId: BigInt(7), streamerId: BigInt(1) } }, select: { id: true, position: true } });
    expect(mocks.prisma.seasonParticipant.update).toHaveBeenCalledWith(expect.objectContaining({ data: { roles: ["CAPTAIN"], position: "DAMAGE" } }));
  });

  it("포지션을 보내지 않으면 역할만 저장하고 기존 포지션은 유지한다", async () => {
    mocks.prisma.seasonParticipant.findUnique.mockResolvedValue({ id: BigInt(9), position: "TANK" });
    mocks.prisma.seasonParticipant.update.mockResolvedValue(stored(BigInt(1), ["CAPTAIN"]));
    await updateParticipantRoles(BigInt(7), BigInt(1), ["CAPTAIN"]);
    expect(mocks.prisma.seasonParticipant.update).toHaveBeenCalledWith(expect.objectContaining({ data: { roles: ["CAPTAIN"] } }));
  });

  it("감독 역할 저장은 기존 포지션을 비우고 새 포지션 입력은 거부한다", async () => {
    mocks.prisma.seasonParticipant.findUnique.mockResolvedValue({ id: BigInt(9), position: "TANK" });
    mocks.prisma.seasonParticipant.update.mockResolvedValue({ ...stored(BigInt(1), ["COACH"]), position: null });
    await updateParticipantRoles(BigInt(7), BigInt(1), ["COACH"]);
    expect(mocks.prisma.seasonParticipant.update).toHaveBeenCalledWith(expect.objectContaining({ data: { roles: ["COACH"], position: null } }));
    await expect(updateParticipantRoles(BigInt(7), BigInt(1), ["COACH"], "TANK")).rejects.toMatchObject({ status: 400 });
    mocks.prisma.seasonParticipant.findUnique.mockResolvedValue({ id: BigInt(9), position: null });
    await expect(updateParticipantRoles(BigInt(7), BigInt(1), ["PLAYER"])).rejects.toMatchObject({ status: 400 });
  });

  it("여러 참가자를 한 트랜잭션으로 저장하고 같은 값은 한 번에 갱신한다", async () => {
    mocks.tx.seasonParticipant.findMany
      .mockResolvedValueOnce([{ id: BigInt(11), streamerId: BigInt(1), position: "TANK" }, { id: BigInt(12), streamerId: BigInt(2), position: "TANK" }, { id: BigInt(13), streamerId: BigInt(3), position: "SUPPORT" }])
      .mockResolvedValueOnce([stored(BigInt(1), ["PLAYER"]), stored(BigInt(2), ["PLAYER"]), { ...stored(BigInt(3), ["CAPTAIN"]), position: "DAMAGE" }]);
    mocks.tx.seasonParticipant.updateMany.mockResolvedValueOnce({ count: 2 }).mockResolvedValueOnce({ count: 1 });

    const result = await updateParticipants(BigInt(7), [
      { streamerId: BigInt(1), roles: ["PLAYER"] },
      { streamerId: BigInt(2), roles: ["PLAYER"] },
      { streamerId: BigInt(3), roles: ["CAPTAIN"], position: "DAMAGE" },
    ]);

    expect(result).toHaveLength(3);
    expect(mocks.tx.commonCode.findMany).toHaveBeenCalledTimes(2);
    expect(mocks.tx.seasonParticipant.updateMany).toHaveBeenNthCalledWith(1, { where: { seasonId: BigInt(7), streamerId: { in: [BigInt(1), BigInt(2)] } }, data: { roles: ["PLAYER"], position: "TANK" } });
    expect(mocks.tx.seasonParticipant.updateMany).toHaveBeenNthCalledWith(2, { where: { seasonId: BigInt(7), streamerId: { in: [BigInt(3)] } }, data: { roles: ["CAPTAIN"], position: "DAMAGE" } });
  });
});
