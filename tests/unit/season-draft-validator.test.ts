// 팀 편성 저장 전 팀원 중복과 지명 순서 검증을 확인한다.
import { describe, expect, it } from "vitest";
import { validateDraftInput } from "@/lib/seasons/draftValidator";

describe("시즌 팀 편성 검증", () => {
  it("같은 참가자를 두 팀에 배정하지 않는다", () => {
    expect(() => validateDraftInput({ teams: [{ name: "A", sortOrder: 1, members: ["1"] }, { name: "B", sortOrder: 2, members: ["1"] }], draftOrders: [] })).toThrow("둘 이상의 팀");
  });

  it("시즌의 지명 순서 중복과 잘못된 번호를 거부한다", () => {
    expect(() => validateDraftInput({ teams: [], draftOrders: [{ streamerId: "1", order: 2 }, { streamerId: "2", order: 2 }] })).toThrow("중복 없는 양의 정수");
    expect(() => validateDraftInput({ teams: [], draftOrders: [{ streamerId: "1", order: 0 }] })).toThrow("중복 없는 양의 정수");
  });

  it("미지명 참가자는 여러 명 허용한다", () => {
    expect(() => validateDraftInput({ teams: [{ name: "A", sortOrder: 1, members: ["1"] }], draftOrders: [{ streamerId: "1", order: null }, { streamerId: "2", order: null }] })).not.toThrow();
  });

  it("팀장 순서 중복과 누락을 막는다", () => {
    expect(() => validateDraftInput({ teams: [{ name: "A", sortOrder: 1, members: [] }, { name: "B", sortOrder: 1, members: [] }], draftOrders: [] })).toThrow("팀장 순서");
  });
});
