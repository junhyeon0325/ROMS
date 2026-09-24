// 스트리머 요청에서 채널 ID를 추출하고 등록·수정 입력 조건을 검증한다.
import { describe, expect, it } from "vitest";
import {
  extractChzzkChannelId,
  normalizeStreamerPayload,
  validateStreamerPayload,
} from "@/lib/streamers/streamerValidator";

describe("스트리머 Validator", () => {
  it.each([
    ["channel-id", "channel-id"],
    [" https://chzzk.naver.com/channel-id/ ", "channel-id"],
    ["https://www.chzzk.naver.com/live/channel-id?tab=about", "channel-id"],
    ["https://m.chzzk.naver.com/channel-id", "channel-id"],
  ])("%s에서 채널 ID를 추출한다", (input, expected) => {
    expect(extractChzzkChannelId(input)).toBe(expected);
  });

  it("빈 채널 입력은 null로 정규화한다", () => {
    expect(extractChzzkChannelId("   ")).toBeNull();
    expect(extractChzzkChannelId(null)).toBeNull();
  });

  it("기존 채널 필드와 문자열 입력을 서비스 형식으로 정규화한다", () => {
    expect(
      normalizeStreamerPayload({
        id: "7",
        name: "  러너  ",
        channelUrl: "https://chzzk.naver.com/runner-id",
        profileImg: "  https://example.com/profile.png  ",
        memo: "  메모  ",
        isUse: false,
      }),
    ).toEqual({
      id: "7",
      name: "러너",
      isChzzk: true,
      chzzkChannelId: "runner-id",
      profileImg: "https://example.com/profile.png",
      hasValidProfileImg: true,
      memo: "메모",
      isUse: false,
    });
  });

  it("일반 등록은 채널을 제거하고 정상 입력으로 허용한다", () => {
    const payload = normalizeStreamerPayload({ name: "일반 사용자", isChzzk: false });
    expect(payload.chzzkChannelId).toBeNull();
    expect(validateStreamerPayload(payload)).toBeNull();
  });

  it("수정 ID, 이름, 연동 채널 누락을 각각 거부한다", () => {
    expect(
      validateStreamerPayload(normalizeStreamerPayload({ name: "사용자" }), true),
    ).toBe("수정할 스트리머 ID가 누락되었습니다.");
    expect(validateStreamerPayload(normalizeStreamerPayload({}))).toBe(
      "스트리머 이름 또는 채널명을 입력해주세요.",
    );
    expect(
      validateStreamerPayload(normalizeStreamerPayload({ name: "사용자", isChzzk: true })),
    ).toContain("연동할 채널을 선택");
  });
});
