// 공통 코드와 코드 그룹 요청의 정규화·필수값·식별자 형식 검증을 확인한다.
import { describe, expect, it } from "vitest";
import {
  normalizeCodePayload,
  validateCodePayload,
} from "@/lib/codes/codeValidator";
import {
  normalizeCodeGroupPayload,
  validateCodeGroupPayload,
} from "@/lib/codes/codeGroupValidator";

describe("공통 코드 Validator", () => {
  it("호환 필드와 공백을 정규화하고 입력 여부 플래그를 보존한다", () => {
    expect(
      normalizeCodePayload({
        group: " hero_role ",
        code: " role_tank ",
        codeName: "  탱커  ",
        sort: "2",
        useYn: "N",
        desc: "  선봉 역할  ",
      }),
    ).toEqual({
      groupCode: "HERO_ROLE",
      code: "ROLE_TANK",
      name: "탱커",
      sortOrder: 2,
      isUse: false,
      remarks: "선봉 역할",
      hasSortOrder: true,
      hasIsUse: true,
      hasRemarks: true,
    });
  });

  it("선택값이 없으면 안전한 기본값을 사용한다", () => {
    expect(normalizeCodePayload({ groupCode: "GROUP", code: "ITEM" })).toMatchObject({
      sortOrder: 0,
      isUse: true,
      remarks: "",
      hasSortOrder: false,
      hasIsUse: false,
      hasRemarks: false,
    });
  });

  it("필수값과 대문자 식별자 형식을 검증한다", () => {
    expect(validateCodePayload(normalizeCodePayload({}))).toBe(
      "그룹 코드와 상세 코드 ID가 필요합니다.",
    );
    expect(
      validateCodePayload(
        normalizeCodePayload({ groupCode: "GROUP", code: "BAD-CODE", name: "이름" }),
      ),
    ).toBe("상세 코드 ID에는 영문 대문자, 숫자, 밑줄만 사용할 수 있습니다.");
    expect(
      validateCodePayload(
        normalizeCodePayload({ groupCode: "GROUP", code: "VALID_01", name: "이름" }),
      ),
    ).toBeNull();
  });
});

describe("코드 그룹 Validator", () => {
  it("문자열을 정리하고 false와 빈 비고를 보존한다", () => {
    expect(
      normalizeCodeGroupPayload({
        groupCode: " system_role ",
        groupName: "  시스템 역할  ",
        remarks: "   ",
        sortOrder: "3",
        isUse: false,
      }),
    ).toEqual({
      groupCode: "SYSTEM_ROLE",
      groupName: "시스템 역할",
      remarks: null,
      sortOrder: 3,
      isUse: false,
    });
  });

  it("필수 이름과 그룹 코드 형식을 선택적으로 검증한다", () => {
    const withoutName = normalizeCodeGroupPayload({ groupCode: "VALID_CODE" });
    expect(validateCodeGroupPayload(withoutName)).toBe("그룹명을 입력해주세요.");
    expect(validateCodeGroupPayload(withoutName, false)).toBeNull();
    expect(
      validateCodeGroupPayload(
        normalizeCodeGroupPayload({ groupCode: "BAD-CODE", groupName: "잘못된 코드" }),
      ),
    ).toContain("영문 대문자");
  });
});
