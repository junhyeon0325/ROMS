// File: lib/codes/codeGroupDto.ts
// Page/Component: 코드 그룹 DTO
// Purpose: Prisma 공통 코드 그룹 모델을 관리자 API 응답 형식으로 변환한다.

import type { CommonCodeGroup } from "@prisma/client";
import type { CodeGroupItem } from "@/lib/types/codes";

// DB의 날짜와 nullable 필드를 화면용 코드 그룹 형식으로 직렬화한다.
export function formatCodeGroupDto(group: CommonCodeGroup): CodeGroupItem {
  return { groupCode: group.groupCode, groupName: group.groupName, remarks: group.remarks || "", sortOrder: group.sortOrder ?? 0, isUse: group.isUse ?? true, createdAt: group.createdAt.toISOString().split("T")[0] };
}
