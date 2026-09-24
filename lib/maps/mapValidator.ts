// File: lib/maps/mapValidator.ts
// Page/Component: mapValidator
// Purpose: 지도 API 요청을 저장 가능한 값으로 정규화하고 입력 조건을 검사한다.
import { MAP_MODE_GROUP_CODE } from "@/lib/constants/maps";
import { prisma } from "@/lib/prisma";
import { validateHttpsImageUrl } from "@/lib/validation/imageUrlValidator";

export function normalizeMapPayload(body: Record<string, unknown>) {
  const nameKr = String(body.nameKr || "").trim();
  const nameEn = String(body.nameEn || "").trim();
  const hasValidImageUrl = body.imageUrl === undefined || body.imageUrl === null || typeof body.imageUrl === "string";
  return { name: nameKr || nameEn, nameEn, mapType: String(body.mode || "").trim().toUpperCase(), location: String(body.location || "").trim(), countryCode: String(body.countryCode || "").trim().toUpperCase(), imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "", hasValidImageUrl, isActive: body.isActive === true, hasValidIsActive: typeof body.isActive === "boolean", source: body.source === "OVERFAST" ? "OVERFAST" : "MANUAL", sourceKey: String(body.sourceKey || "").trim() || null, remarks: String(body.desc || "").trim() };
}

// 지도 필수값, 코드 사용 여부와 외부 출처 중복을 확인한다.
export async function validateMapPayload(payload: ReturnType<typeof normalizeMapPayload>, id?: string) {
  if (!payload.nameEn || !payload.mapType) return "영문명과 맵 모드는 필수입니다.";
  if (!payload.hasValidIsActive) return "사용 여부를 true 또는 false로 입력해주세요.";
  if (!payload.hasValidImageUrl) return "이미지 URL은 문자열 또는 빈 값이어야 합니다.";
  const imageUrlError = validateHttpsImageUrl(payload.imageUrl);
  if (imageUrlError) return imageUrlError;
  const mode = await prisma.commonCode.findFirst({ where: { groupCode: MAP_MODE_GROUP_CODE, code: payload.mapType, isUse: true } });
  if (!mode) return "등록되어 사용 가능한 MAP_MODE 코드를 선택해주세요.";
  if (!payload.sourceKey) return null;
  const duplicated = await prisma.mapItem.findUnique({ where: { sourceKey: payload.sourceKey } });
  return duplicated && duplicated.id.toString() !== id ? "이미 등록된 외부 맵 데이터입니다." : null;
}
