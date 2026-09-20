// File: lib/codes/codeGroupService.ts
// Page/Component: 코드 그룹 서비스
// Purpose: 공통 코드 그룹의 Prisma 조회·등록·수정·삭제를 담당한다.

import { prisma } from "@/lib/prisma";
import { formatCodeGroupDto } from "@/lib/codes/codeGroupDto";
import type { CodeGroupPayload } from "@/lib/codes/codeGroupValidator";

// 정렬 순서와 생성일 기준으로 코드 그룹 목록을 조회한다.
export async function findCodeGroups() { return (await prisma.commonCodeGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })).map(formatCodeGroupDto); }
// 그룹 코드로 기존 레코드를 조회한다.
export async function findCodeGroup(groupCode: string) { return prisma.commonCodeGroup.findUnique({ where: { groupCode } }); }
// 정규화된 입력으로 코드 그룹을 생성한다.
export async function createCodeGroup(payload: CodeGroupPayload) { return formatCodeGroupDto(await prisma.commonCodeGroup.create({ data: payload })); }
// 정규화된 입력으로 코드 그룹을 수정한다.
export async function updateCodeGroup(payload: CodeGroupPayload) { return formatCodeGroupDto(await prisma.commonCodeGroup.update({ where: { groupCode: payload.groupCode }, data: { groupName: payload.groupName, remarks: payload.remarks, sortOrder: payload.sortOrder, isUse: payload.isUse } })); }
// 그룹과 연결된 상세 코드를 Prisma 관계 설정에 따라 삭제한다.
export async function deleteCodeGroup(groupCode: string) { await prisma.commonCodeGroup.delete({ where: { groupCode } }); }
