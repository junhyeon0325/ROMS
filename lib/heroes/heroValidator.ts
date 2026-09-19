// File: lib/heroes/heroValidator.ts
// Page/Component: heroValidator
// Purpose: 영웅 API 요청을 정규화하고 역할·필수값을 검증한다.
const HERO_ROLES = ["TANK", "DAMAGE", "SUPPORT"] as const;

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

export function validateHeroPayload(
  payload: ReturnType<typeof normalizeHeroPayload>,
) {
  if (!payload.name || !payload.nameEn)
    return "영웅 국문명과 영문명을 입력해주세요.";
  if (!HERO_ROLES.includes(payload.role as (typeof HERO_ROLES)[number]))
    return "올바른 역할군을 선택해주세요.";
  return payload.hasValidIsPickable ? null : "사용 여부를 선택해주세요.";
}
