// 선수 추가 그리드의 검색 결과 다중 선택에서 중복·기등록 제외를 확인한다.
import { describe, expect, it } from "vitest";
import { toggleSelectedStreamer, toggleVisibleStreamers } from "@/lib/seasons/participantSelection";

describe("대회 선수 추가 다중 선택", () => {
  const registered = new Set(["2"]);

  it("이미 참가한 선수는 선택하지 않고 행을 다시 누르면 선택을 해제한다", () => {
    expect(toggleSelectedStreamer(["1"], "2", registered)).toEqual(["1"]);
    expect(toggleSelectedStreamer(["1"], "1", registered)).toEqual([]);
    expect(toggleSelectedStreamer(["1"], "3", registered)).toEqual(["1", "3"]);
  });

  it("검색 결과 전체 선택은 기등록·중복을 제외하고 다른 검색 결과의 선택을 보존한다", () => {
    const selected = toggleVisibleStreamers(["9"], ["1", "2", "3", "3"], registered);
    expect(selected).toEqual(["9", "1", "3"]);
    expect(toggleVisibleStreamers(selected, ["1", "2", "3"], registered)).toEqual(["9"]);
  });
});
