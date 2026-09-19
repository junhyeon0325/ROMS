// File: lib/codes/codeValidator.ts
// Page/Component: codeValidator
// Purpose: 공통 코드 API 요청을 정규화하고 필수 입력을 검증한다.
export function normalizeCodePayload(body: Record<string, unknown>) {
  const hasSortOrder = body.sortOrder !== undefined || body.sort !== undefined;
  const hasIsUse = body.isUse !== undefined || body.useYn !== undefined;
  const hasRemarks = body.remarks !== undefined || body.desc !== undefined;
  return { groupCode: String(body.groupCode || body.group || "").trim().toUpperCase(), code: String(body.code || "").trim().toUpperCase(), name: String(body.name || body.codeName || "").trim(), sortOrder: Number(body.sortOrder ?? body.sort) || 0, isUse: body.isUse !== undefined ? Boolean(body.isUse) : body.useYn !== undefined ? body.useYn === "Y" : true, remarks: String(body.remarks ?? body.desc ?? "").trim(), hasSortOrder, hasIsUse, hasRemarks };
}

export function validateCodePayload(payload: ReturnType<typeof normalizeCodePayload>, requireName = true) {
  if (!payload.groupCode || !payload.code) return "그룹 코드와 상세 코드 ID가 필요합니다.";
  if (requireName && !payload.name) return "코드명을 입력해주세요.";
  return /^[A-Z0-9_]+$/.test(payload.code) ? null : "상세 코드 ID에는 영문 대문자, 숫자, 밑줄만 사용할 수 있습니다.";
}
