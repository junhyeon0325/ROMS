// 관리자 입력 이미지 URL의 HTTPS·형식 검증과 저장 Validator 연결을 확인한다.
import { describe, expect, it } from "vitest";
import {
  normalizeMapPayload,
  validateMapPayload,
} from "@/lib/maps/mapValidator";
import {
  normalizeStreamerPayload,
  validateStreamerPayload,
} from "@/lib/streamers/streamerValidator";
import { validateHttpsImageUrl } from "@/lib/validation/imageUrlValidator";

describe("관리자 이미지 URL 검증", () => {
  it("HTTPS 절대 URL을 허용한다", () => {
    expect(validateHttpsImageUrl("https://images.example.com/profile.png")).toBeNull();
  });

  it("잘못된 URL 형식을 거부한다", () => {
    expect(validateHttpsImageUrl("not a url")).toBe("이미지 URL 형식이 올바르지 않습니다.");
  });

  it.each([
    "http://images.example.com/profile.png",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "blob:https://example.com/1234",
  ])("%s 스킴을 거부한다", (value) => {
    expect(validateHttpsImageUrl(value)).toBe("이미지 URL은 https: 주소만 사용할 수 있습니다.");
  });

  it("nullable 이미지 URL의 빈 값은 허용한다", () => {
    expect(validateHttpsImageUrl("")).toBeNull();
    expect(normalizeStreamerPayload({ name: "스트리머", profileImg: null })).toMatchObject({
      profileImg: "",
      hasValidProfileImg: true,
    });
  });

  it("스트리머 Validator가 잘못된 프로필 이미지 URL을 반환한다", () => {
    const payload = normalizeStreamerPayload({
      name: "스트리머",
      isChzzk: false,
      profileImg: "http://images.example.com/profile.png",
    });

    expect(validateStreamerPayload(payload)).toBe("이미지 URL은 https: 주소만 사용할 수 있습니다.");
  });

  it("지도 Validator가 데이터베이스 조회 전에 잘못된 이미지 URL을 반환한다", async () => {
    const payload = normalizeMapPayload({
      nameEn: "Map",
      mode: "CONTROL",
      isActive: true,
      imageUrl: "javascript:alert(1)",
    });

    await expect(validateMapPayload(payload)).resolves.toBe(
      "이미지 URL은 https: 주소만 사용할 수 있습니다.",
    );
  });

  it("문자열이 아닌 명시적 이미지 URL 입력을 거부한다", async () => {
    const streamerPayload = normalizeStreamerPayload({ name: "스트리머", profileImg: 123 });
    const mapPayload = normalizeMapPayload({
      nameEn: "Map",
      mode: "CONTROL",
      isActive: true,
      imageUrl: 123,
    });

    expect(validateStreamerPayload(streamerPayload)).toBe(
      "프로필 이미지 URL은 문자열 또는 빈 값이어야 합니다.",
    );
    await expect(validateMapPayload(mapPayload)).resolves.toBe(
      "이미지 URL은 문자열 또는 빈 값이어야 합니다.",
    );
  });
});
