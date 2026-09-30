// 시즌 맵 구성 서비스의 조회·저장 순서와 중복 차단을 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = { season: { findUnique: vi.fn() }, mapItem: { findMany: vi.fn() }, seasonMap: { deleteMany: vi.fn(), createMany: vi.fn(), findMany: vi.fn() }, matchSet: { count: vi.fn() } };
  return { tx, prisma: { seasonMap: { findMany: vi.fn() }, $transaction: vi.fn() } };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import { findSeasonMaps, saveSeasonMaps } from "@/lib/seasons/mapPoolService";

const row = { mapId: BigInt(5), map: { id: BigInt(5), name: "네팔", nameEn: "Nepal", mapType: "CONTROL", location: "히말라야", imageUrl: null, isActive: true }, sortOrder: 0 };

describe("시즌 맵 구성 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(mocks.tx));
    mocks.tx.season.findUnique.mockResolvedValue({ id: BigInt(2) });
    mocks.tx.mapItem.findMany.mockResolvedValue([{ id: BigInt(5) }]);
    mocks.tx.seasonMap.findMany.mockResolvedValue([row]);
    mocks.tx.matchSet.count.mockResolvedValue(0);
  });

  it("저장된 시즌 구성에서 맵 ID와 순서를 DTO로 반환한다", async () => {
    mocks.prisma.seasonMap.findMany.mockResolvedValue([row]);
    await expect(findSeasonMaps(BigInt(2))).resolves.toEqual([{ id: "5", nameKr: "네팔", nameEn: "Nepal", mode: "CONTROL", location: "히말라야", imageUrl: null, isActive: true, sortOrder: 0 }]);
  });

  it("맵 배열 순서대로 연결을 만들고 기존 구성은 교체한다", async () => {
    await saveSeasonMaps(BigInt(2), [BigInt(5)]);
    expect(mocks.tx.seasonMap.deleteMany).toHaveBeenCalledWith({ where: { seasonId: BigInt(2) } });
    expect(mocks.tx.seasonMap.createMany).toHaveBeenCalledWith({ data: [{ seasonId: BigInt(2), mapId: BigInt(5), sortOrder: 0 }] });
  });

  it("대회가 없으면 저장하지 않는다", async () => {
    mocks.tx.season.findUnique.mockResolvedValue(null);
    await expect(saveSeasonMaps(BigInt(9), [])).rejects.toThrow("대회를 찾을 수 없습니다.");
    expect(mocks.tx.seasonMap.deleteMany).not.toHaveBeenCalled();
  });

  it("사용 불가능한 맵 ID가 포함되면 기존 구성을 보존한다", async () => {
    mocks.tx.mapItem.findMany.mockResolvedValue([]);
    await expect(saveSeasonMaps(BigInt(2), [BigInt(5)])).rejects.toThrow("사용할 수 없는 맵");
    expect(mocks.tx.seasonMap.deleteMany).not.toHaveBeenCalled();
  });

  it("경기 세트에서 사용 중인 맵은 대회 맵 구성에서 제외하지 않는다", async () => {
    mocks.tx.mapItem.findMany.mockResolvedValue([]);
    mocks.tx.seasonMap.findMany.mockResolvedValueOnce([{ mapId: BigInt(5) }]);
    mocks.tx.matchSet.count.mockResolvedValue(1);
    await expect(saveSeasonMaps(BigInt(2), [])).rejects.toThrow("경기 세트에 사용된 맵");
    expect(mocks.tx.seasonMap.deleteMany).not.toHaveBeenCalled();
  });
});
