// 지도 서비스의 Prisma 호출과 DTO 반환 계약을 검증한다.
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    commonCode: { findMany: vi.fn() },
    mapItem: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
  transaction: {
    mapItem: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import {
  MapImportValidationError,
  createMap,
  findMaps,
  importMaps,
  updateMap,
} from "@/lib/maps/mapService";
import { normalizeMapPayload } from "@/lib/maps/mapValidator";

const mapRecord = {
  id: BigInt(1),
  name: "하나무라",
  nameEn: "Hanamura",
  mapType: "ASSAULT",
  location: null,
  countryCode: null,
  imageUrl: "https://cdn.example.com/maps/hanamura.webp",
  isActive: true,
  source: "MANUAL",
  sourceKey: null,
  createdBy: null,
  createdAt: new Date("2026-09-22T00:00:00.000Z"),
  updatedBy: null,
  updatedAt: new Date("2026-09-22T00:00:00.000Z"),
  remarks: null,
};

// 지도 생성·수정에 사용하는 검증 완료 입력을 만든다.
function createPayload(overrides: Record<string, unknown> = {}) {
  return normalizeMapPayload({
    nameKr: "하나무라",
    nameEn: "Hanamura",
    mode: "assault",
    imageUrl: "https://cdn.example.com/maps/hanamura.webp",
    isActive: true,
    ...overrides,
  });
}

// OverFast 가져오기에 사용하는 최소 유효 입력을 만든다.
function createImportPayload(overrides: Record<string, unknown> = {}) {
  return {
    nameEn: "Esperanca",
    mode: "PUSH",
    location: "Portugal",
    countryCode: "PT",
    imageUrl: "https://cdn.example.com/maps/esperanca.webp",
    sourceKey: "overfast-esperanca",
    ...overrides,
  };
}

describe("mapService", () => {
  beforeEach(() => {
    mocks.prisma.commonCode.findMany.mockResolvedValue([{ code: "PUSH" }]);
    mocks.transaction.mapItem.findMany.mockResolvedValue([]);
    mocks.prisma.$transaction.mockImplementation(async (callback) => callback(mocks.transaction));
  });

  it("조회 결과를 지도 DTO 배열로 반환한다", async () => {
    mocks.prisma.mapItem.findMany.mockResolvedValue([mapRecord]);

    await expect(findMaps()).resolves.toEqual([
      expect.objectContaining({
        id: "1",
        nameKr: "하나무라",
        imageUrl: "https://cdn.example.com/maps/hanamura.webp",
      }),
    ]);
    expect(mocks.prisma.mapItem.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
  });

  it("조회 결과가 없으면 빈 배열을 반환한다", async () => {
    mocks.prisma.mapItem.findMany.mockResolvedValue([]);

    await expect(findMaps()).resolves.toEqual([]);
  });

  it("정상 생성 시 Prisma 데이터와 DTO를 변환한다", async () => {
    mocks.prisma.mapItem.create.mockResolvedValue(mapRecord);

    await expect(createMap(createPayload())).resolves.toMatchObject({
      id: "1",
      nameKr: "하나무라",
      mode: "ASSAULT",
    });
    expect(mocks.prisma.mapItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "하나무라",
        mapType: "ASSAULT",
        imageUrl: "https://cdn.example.com/maps/hanamura.webp",
      }),
    });
  });

  it("정상 수정 시 문자열 ID를 BigInt 조건으로 변환하고 DTO를 반환한다", async () => {
    mocks.prisma.mapItem.update.mockResolvedValue({ ...mapRecord, isActive: false });

    await expect(updateMap("1", createPayload({ isActive: false }))).resolves.toMatchObject({
      id: "1",
      isActive: false,
    });
    expect(mocks.prisma.mapItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: BigInt(1) } }),
    );
  });

  it("가져오기 입력이 비어 있으면 DB 호출 전에 검증 오류를 반환한다", async () => {
    await expect(importMaps([])).rejects.toThrow("등록할 신규 맵을 선택해 주세요.");

    expect(mocks.prisma.commonCode.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("가져오기 입력의 sourceKey가 중복되면 DB 호출 전에 거부한다", async () => {
    const value = createImportPayload();

    await expect(importMaps([value, value])).rejects.toThrow("동일한 신규 맵이 중복 선택되었습니다.");

    expect(mocks.prisma.commonCode.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("트랜잭션에서 이미 등록된 sourceKey를 찾으면 중복 오류를 반환한다", async () => {
    mocks.transaction.mapItem.findMany.mockResolvedValue([{ sourceKey: "overfast-esperanca" }]);

    await expect(importMaps([createImportPayload()])).rejects.toBeInstanceOf(MapImportValidationError);
    expect(mocks.transaction.mapItem.create).not.toHaveBeenCalled();
  });

  it("P2002 Prisma 예외를 동시 등록 중복 오류로 변환한다", async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError("duplicate", {
      code: "P2002",
      clientVersion: "test",
    });
    mocks.prisma.$transaction.mockRejectedValueOnce(duplicateError);

    await expect(importMaps([createImportPayload()])).rejects.toThrow(
      "다른 요청으로 이미 등록된 신규 맵이 포함되어 있습니다.",
    );
  });
});
