// File: lib/codes/codeService.ts
// Page/Component: codeService
// Purpose: 공통 코드 조회·저장·삭제 Prisma 접근을 캡슐화한다.
import { prisma } from "@/lib/prisma";
import { formatCode } from "@/lib/codes/codeDto";
import type { normalizeCodePayload } from "@/lib/codes/codeValidator";
type Payload = ReturnType<typeof normalizeCodePayload>;

export async function findCodes(groupCode?: string) { return (await prisma.commonCode.findMany({ where: groupCode ? { groupCode } : {}, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })).map(formatCode); }
export async function createCode(payload: Payload) { const group = await prisma.commonCodeGroup.findUnique({ where: { groupCode: payload.groupCode } }); if (!group) return null; return formatCode(await prisma.commonCode.create({ data: { groupCode: payload.groupCode, code: payload.code, codeName: payload.name, sortOrder: payload.sortOrder, isUse: payload.isUse, remarks: payload.remarks || null } })); }
export async function updateCode(payload: Payload) { return formatCode(await prisma.commonCode.update({ where: { groupCode_code: { groupCode: payload.groupCode, code: payload.code } }, data: { codeName: payload.name, ...(payload.hasSortOrder ? { sortOrder: payload.sortOrder } : {}), ...(payload.hasIsUse ? { isUse: payload.isUse } : {}), ...(payload.hasRemarks ? { remarks: payload.remarks || null } : {}) } })); }
export async function deleteCode(groupCode: string, code: string) { await prisma.commonCode.delete({ where: { groupCode_code: { groupCode, code } } }); }
