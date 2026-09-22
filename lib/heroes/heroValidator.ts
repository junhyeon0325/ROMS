// File: lib/heroes/heroValidator.ts
// Page/Component: heroValidator
// Purpose: 영웅 API 요청을 정규화하고 역할·필수값을 검증한다.
import { HERO_ROLE_GROUP_CODE } from "@/lib/constants/commonCodes";
import { prisma } from "@/lib/prisma";

export function normalizeHeroPayload(body: Record<string, unknown>) {
  return {
    name: String(body.nameKr || "").trim(),
    nameEn: String(body.nameEn || "").trim(),
    role: String(body.role || "")
      .trim()
      .toUpperCase(),
    isPickable: body.isPickable === true,
    hasValidIsPickable: typeof body.isPickable === "boolean",
    imageUrl: String(body.imageUrl || "").trim(),
    source: body.source === "OVERFAST" ? "OVERFAST" : "MANUAL",
    sourceKey: String(body.sourceKey || "").trim() || null,
    remarks: String(body.desc || "").trim(),
  };
}

// 활성 HERO_ROLE 공통코드에 등록된 역할만 영웅 데이터로 저장한다.
export async function validateHeroPayload(
  payload: ReturnType<typeof normalizeHeroPayload>,
) {
  if (!payload.name || !payload.nameEn)
    return "영웅 국문명과 영문명을 입력해주세요.";
  const role = await prisma.commonCode.findFirst({
    where: { groupCode: HERO_ROLE_GROUP_CODE, code: payload.role, isUse: true },
    select: { code: true },
  });
  if (!role)
    return "올바른 역할군을 선택해주세요.";
  return payload.hasValidIsPickable ? null : "사용 여부를 선택해주세요.";
}
