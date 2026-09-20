// File: lib/codes/codeGroupValidator.ts
// Page/Component: 코드 그룹 요청 검증
// Purpose: 코드 그룹 등록·수정·삭제 요청을 정규화하고 입력값을 검증한다.

export interface CodeGroupPayload { groupCode: string; groupName: string; remarks: string | null; sortOrder: number; isUse: boolean; }

// 기존 API 요청값을 코드 그룹 서비스용 형식으로 정규화한다.
export function normalizeCodeGroupPayload(body: Record<string, unknown>): CodeGroupPayload {
  return { groupCode: typeof body.groupCode === "string" ? body.groupCode.trim().toUpperCase() : "", groupName: typeof body.groupName === "string" ? body.groupName.trim() : "", remarks: typeof body.remarks === "string" && body.remarks.trim() ? body.remarks.trim() : null, sortOrder: Number(body.sortOrder) || 0, isUse: body.isUse !== false };
}

// 등록·수정 필수값과 그룹 코드 형식을 확인한다.
export function validateCodeGroupPayload(payload: CodeGroupPayload, requireName = true): string | null {
  if (!payload.groupCode) return "그룹 코드가 필요합니다.";
  if (requireName && !payload.groupName) return "그룹명을 입력해주세요.";
  if (!/^[A-Z0-9_]+$/.test(payload.groupCode)) return "그룹 코드는 영문 대문자, 숫자, 언더스코어(_)만 사용할 수 있습니다. (예: SYSTEM_ROLE)";
  return null;
}
