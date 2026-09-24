// 대회 기간, 선택 일정, 상태 및 상금의 저장 경계 검증을 확인한다.
import { describe, expect, it } from "vitest";
import { formatMoneyInput, isValidMoneyAmount, parseLegacyPrize } from "@/lib/seasons/money";
import { normalizeSeasonPayload, validateSeasonPayload } from "@/lib/seasons/seasonValidator";

const base = { name: "러너리그", startDate: "2026-02-20", endDate: "2026-02-27", prizeAmount: "20000000", schedules: [], rankPrizes: [] };

describe("대회 등록 검증", () => {
  it("기본 상태와 일정 없는 대회를 허용하고 제거된 상태는 거부한다", () => {
    const payload = normalizeSeasonPayload(base);
    expect(payload.status).toBe("개최 예정");
    expect(validateSeasonPayload(payload)).toBeNull();
    const removedStatus = normalizeSeasonPayload({ ...base, status: "접수중" });
    expect(validateSeasonPayload(removedStatus)).toContain("진행 상태");
  });

  it("소개 메모를 remarks로 정규화한다", () => {
    const payload = normalizeSeasonPayload({ ...base, remarks: "  대회 소개  " });
    expect(payload.remarks).toBe("대회 소개");
    expect(validateSeasonPayload(payload)).toBeNull();
  });

  it("실제 달력 날짜와 종료일 역전을 거부한다", () => {
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, startDate: "2026-02-30" }))).toContain("시작일과 종료일");
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, endDate: "2026-02-19" }))).toContain("빠를 수 없습니다");
  });

  it("이름만 있는 일정과 기간 양 끝의 여러 날짜 범위를 허용한다", () => {
    const payload = normalizeSeasonPayload({ ...base, schedules: [
      { name: "팀원 선정", startDate: null, endDate: null },
      { name: "개막", startDate: "2026-02-20", endDate: "2026-02-21" },
      { name: "결승", startDate: "2026-02-27", endDate: "2026-02-27" },
    ] });
    expect(validateSeasonPayload(payload)).toBeNull();
  });

  it("기간 밖 일정과 이름 없는 일정을 거부한다", () => {
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, schedules: [{ name: "행사", startDate: "2026-02-19", endDate: null }] }))).toContain("진행 기간 안");
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, schedules: [{ name: "", startDate: null, endDate: null }] }))).toContain("이름");
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, schedules: [{ name: "행사", startDate: null, endDate: "2026-02-22" }] }))).toContain("시작일");
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, schedules: [{ name: "행사", startDate: "2026-02-23", endDate: "2026-02-22" }] }))).toContain("빠를 수 없습니다");
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, schedules: [{ name: "행사", startDate: "2026-02-26", endDate: "2026-02-28" }] }))).toContain("진행 기간 안");
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, schedules: [{ name: "행사", startDate: "2026-02-30", endDate: null }] }))).toContain("시작일이 올바르지");
  });

  it("금액의 빈 값·0·잘못된 입력과 중복 등수를 거부한다", () => {
    for (const amount of ["", "0", "1.5", "1,000", "1000000000000000000"]) {
      expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, prizeAmount: amount }))).toContain("총 상금");
    }
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, rankPrizes: [{ rank: 1, amount: "0" }] }))).toContain("1위 상금");
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, rankPrizes: [{ rank: 1, amount: "100" }, { rank: 1, amount: "200" }] }))).toContain("중복");
  });

  it("상금 표시와 저장 문자열을 분리하고 기존 원화 문자열을 복원한다", () => {
    expect(formatMoneyInput("20000000")).toBe("20,000,000");
    expect(parseLegacyPrize("5,000,000원")).toBe("5000000");
    expect(parseLegacyPrize("협의중")).toBeNull();
    expect(isValidMoneyAmount("999999999999999999")).toBe(true);
    expect(validateSeasonPayload(normalizeSeasonPayload({ ...base, rankPrizes: [{ rank: 1, amount: "10000000" }, { rank: 2, amount: "5000000" }] }))).toBeNull();
  });
});
