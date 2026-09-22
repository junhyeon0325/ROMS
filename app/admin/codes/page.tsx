// app/admin/codes/page.tsx
/**
 * [공통 코드 관리 페이지 메인 컴포넌트]
 * - 상하 5:5 분할 마스터-디테일 그리드 레이아웃 조율자
 * - 상단 그리드(50%): CodeGroupSection (공통코드 그룹 목록/인라인 CRUD)
 * - 하단 그리드(50%): DetailCodeSection (세부코드 목록/인메모리 캐시/인라인 CRUD)
 * - 컴포넌트 분리를 통해 불필요한 연쇄 리렌더링 차단 및 유지보수성 극대화
 */
"use client";

import React, { useState, useMemo } from "react";
import { useAdminCodes } from "@/lib/context/AdminFeatureContexts";
import CodeGroupSection from "./components/CodeGroupSection";
import DetailCodeSection from "./components/DetailCodeSection";

export default function AdminCodesPage() {
  const { items: codeGroups } = useAdminCodes();

  // 1. 선택된 코드 그룹 상태 (초기값: 미선택)
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>("");
  // 최근 삭제된 코드 그룹 상태 (하단 세부코드 캐시 정리용)
  const [deletedGroupCode, setDeletedGroupCode] = useState<string>("");

  // 현재 선택된 그룹의 그룹명 추출 (하단 헤더 뱃지 표시용)
  const currentGroup = useMemo(() => {
    return codeGroups.find((g) => g.groupCode === selectedGroupCode) || null;
  }, [codeGroups, selectedGroupCode]);

  // 그룹 선택 변경 핸들러
  const handleSelectGroup = (groupCode: string) => {
    if (selectedGroupCode === groupCode) return;
    setSelectedGroupCode(groupCode);
  };

  // 그룹 삭제 시 선택 해제 및 캐시 무효화 통지
  const handleGroupDeleted = (targetGroupCode: string) => {
    if (selectedGroupCode === targetGroupCode) {
      setSelectedGroupCode("");
    }
    setDeletedGroupCode(targetGroupCode);
  };

  return (
    <section className="h-full min-h-0 flex flex-col gap-4">
      {/* [상단 그리드 (50%)]: 공통코드 그룹 관리 */}
      <CodeGroupSection
        selectedGroupCode={selectedGroupCode}
        onSelectGroup={handleSelectGroup}
        onGroupDeleted={handleGroupDeleted}
      />

      {/* [하단 그리드 (50%)]: 선택된 그룹의 세부 코드 관리 (인메모리 캐시 적용) */}
      <DetailCodeSection
        selectedGroupCode={selectedGroupCode}
        selectedGroupName={currentGroup?.groupName}
        deletedGroupCode={deletedGroupCode}
      />
    </section>
  );
}
