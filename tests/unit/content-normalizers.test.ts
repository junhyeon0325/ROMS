// 영웅과 맵 요청의 순수 정규화가 입력 경계값과 출처 기본값을 보존하는지 확인한다.
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

let normalizeHeroPayload: typeof import("@/lib/heroes/heroValidator").normalizeHeroPayload;
let normalizeMapPayload: typeof import("@/lib/maps/mapValidator").normalizeMapPayload;

beforeAll(async () => {
  ({ normalizeHeroPayload } = await import("@/lib/heroes/heroValidator"));
  ({ normalizeMapPayload } = await import("@/lib/maps/mapValidator"));
});

describe("콘텐츠 입력 정규화", () => {
  it("영웅 문자열·역할·출처와 boolean 경계를 정규화한다", () => {
    expect(
      normalizeHeroPayload({
        nameKr: "  트레이서  ",
        nameEn: "  Tracer  ",
        role: " damage ",
        isPickable: false,
        source: "OVERFAST",
        sourceKey: "  tracer  ",
        desc: "  기동 영웅  ",
      }),
    ).toMatchObject({
      name: "트레이서",
      nameEn: "Tracer",
      role: "DAMAGE",
      isPickable: false,
      hasValidIsPickable: true,
      source: "OVERFAST",
      sourceKey: "tracer",
      remarks: "기동 영웅",
    });

    expect(normalizeHeroPayload({ isPickable: "false", source: "OTHER" })).toMatchObject({
      isPickable: false,
      hasValidIsPickable: false,
      source: "MANUAL",
      sourceKey: null,
    });
  });

  it("맵은 국문명이 없을 때 영문명을 사용하고 코드·boolean을 정규화한다", () => {
    expect(
      normalizeMapPayload({
        nameEn: "  King's Row  ",
        mode: " hybrid ",
        countryCode: " gb ",
        isActive: false,
        source: "OVERFAST",
        sourceKey: "  kings-row  ",
      }),
    ).toMatchObject({
      name: "King's Row",
      nameEn: "King's Row",
      mapType: "HYBRID",
      countryCode: "GB",
      isActive: false,
      hasValidIsActive: true,
      source: "OVERFAST",
      sourceKey: "kings-row",
    });

    expect(normalizeMapPayload({ isActive: 0, source: "OTHER" })).toMatchObject({
      isActive: false,
      hasValidIsActive: false,
      source: "MANUAL",
      sourceKey: null,
    });
  });
});
