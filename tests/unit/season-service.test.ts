// 대회 저장 시 기존 필드와 종료 일시를 보존하며 상금을 숫자로 저장하는지 확인한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => {
  const tx = {
    season: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
    seasonSchedule: { deleteMany: vi.fn(), update: vi.fn(), create: vi.fn() },
  };
  return { prisma: { season: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() }, $transaction: vi.fn() }, tx };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import { createSeason, deleteSeason, updateSeason } from "@/lib/seasons/seasonService";
import { normalizeSeasonPayload } from "@/lib/seasons/seasonValidator";

const record = {
  id: BigInt(1), name: "러너리그", status: "개최 예정",
  startDate: new Date("2026-02-20T00:00:00.000Z"), endDate: new Date("2026-02-27T00:00:00.000Z"),
  prize: "20,000,000원", prizeAmount: new Prisma.Decimal("20000000"), remarks: "대회 안내",
  createdAt: new Date(), updatedAt: new Date(),
  _count: { seasonTeams: 2 },
  schedules: [{ id: BigInt(10), seasonId: BigInt(1), name: "팀원 선정", startAt: new Date("2026-02-19T15:00:00.000Z"), endAt: new Date("2026-02-20T15:00:00.000Z"), sortOrder: 0 }],
  rankPrizes: [{ id: BigInt(20), seasonId: BigInt(1), rank: 1, amount: new Prisma.Decimal("10000000") }],
};

// 정상적인 총 상금과 등수별 상금 입력을 만든다.
function payload() {
  return normalizeSeasonPayload({
    name: "러너리그", startDate: "2026-02-20", endDate: "2026-02-27", prizeAmount: "20000000",
    schedules: [{ id: "10", name: "팀원 선정", startDate: "2026-02-20", endDate: "2026-02-21" }],
    rankPrizes: [{ rank: 1, amount: "10000000" }],
  });
}

describe("대회 저장 서비스", () => {
  beforeEach(() => {
    mocks.prisma.$transaction.mockImplementation((callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx));
    mocks.tx.season.findUnique.mockResolvedValue(record);
    mocks.tx.season.findUniqueOrThrow.mockResolvedValue(record);
    mocks.prisma.season.create.mockResolvedValue(record);
  });

  it("신규 상금을 Decimal로 저장하고 기존 읽기 화면의 금액 문자열도 제공한다", async () => {
    const result = await createSeason(payload());
    expect(result.prizeAmount).toBe("20000000");
    expect(result.prize).toBe("20,000,000원");
    expect(result.rankPrizes).toEqual([{ rank: 1, amount: "10000000" }]);
    const data = mocks.prisma.season.create.mock.calls[0][0].data;
    expect(data.prizeAmount).toBeInstanceOf(Prisma.Decimal);
    expect(data.prizeAmount.toFixed(0)).toBe("20000000");
    expect(data.rankPrizes.create[0].amount.toFixed(0)).toBe("10000000");
    expect(data.remarks).toBeNull();
    expect(result.teamCount).toBe(2);
  });

  it("날짜를 바꾸지 않은 기존 일정의 ID와 시각을 보존한다", async () => {
    const result = await updateSeason(BigInt(1), payload());
    expect(result.schedules[0]).toMatchObject({ startDate: "2026-02-20", endDate: "2026-02-21" });
    expect(mocks.tx.seasonSchedule.update).toHaveBeenCalledWith({ where: { id: BigInt(10) }, data: { name: "팀원 선정", startAt: record.schedules[0].startAt, endAt: record.schedules[0].endAt, sortOrder: 0 } });
    expect(mocks.tx.season.update.mock.calls[0][0].data.rankPrizes.create[0].amount.toFixed(0)).toBe("10000000");
  });

  it("새 일정의 날짜 범위와 빈 날짜를 저장한다", async () => {
    const data = { ...payload(), schedules: [{ name: "예선", startDate: "2026-02-22", endDate: "2026-02-23" }, { name: "발표", startDate: null, endDate: null }] };
    await createSeason(data);
    const schedules = mocks.prisma.season.create.mock.calls.at(-1)![0].data.schedules.create;
    expect(schedules).toEqual([
      { name: "예선", startAt: new Date("2026-02-22T00:00:00.000Z"), endAt: new Date("2026-02-23T00:00:00.000Z"), sortOrder: 0 },
      { name: "발표", startAt: null, endAt: null, sortOrder: 1 },
    ]);
  });

  it("선택한 시즌의 삭제를 서버에 요청한다", async () => {
    await deleteSeason(BigInt(1));
    expect(mocks.prisma.season.delete).toHaveBeenCalledWith({ where: { id: BigInt(1) } });
  });
});
