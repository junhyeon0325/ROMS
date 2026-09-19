// File: lib/codes/codeDto.ts
// Page/Component: codeDto
// Purpose: Prisma 공통 코드 레코드를 관리자 API 응답 형식으로 변환한다.
export function formatCode(code: { groupCode: string; code: string; codeName: string; sortOrder: number | null; isUse: boolean | null; remarks: string | null }) {
  return { groupCode: code.groupCode, code: code.code, name: code.codeName, sortOrder: code.sortOrder ?? 0, isUse: code.isUse ?? true, remarks: code.remarks || "" };
}
