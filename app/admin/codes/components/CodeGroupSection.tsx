// app/admin/codes/components/CodeGroupSection.tsx
/**
 * [공통코드 그룹 관리 그리드 섹션 컴포넌트]
 * - 상단 50% 영역 전담
 * - 그룹 목록 조회, 검색(useDeferredValue), 인라인 추가/수정/삭제
 * - 하단 세부코드와의 렌더링 격리 및 식별자(PK) 자동 마스킹
 */
"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
import { useAdminFeedback } from "@/lib/context/AdminFeatureContexts";
import type { CodeGroupItem } from "@/lib/types/codes";
import AdminCard from "@/components/admin/AdminCard";
import AdminGridHeaderActions from "@/components/admin/AdminGridHeaderActions";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { useInlineGridEdit } from "@/lib/hooks/useInlineGridEdit";
import { INITIAL_GROUP_ADD_FORM, INITIAL_GROUP_EDIT_FORM, type GroupAddForm, type GroupEditForm } from "./codeFormState";
import { useCodeGroupManagement } from "../hooks/useCodeGroupManagement";
import CodeGroupTable from "./CodeGroupTable";

// 코드그룹 폼 인터페이스
interface CodeGroupSectionProps {
  selectedGroupCode: string;
  onSelectGroup: (groupCode: string) => void;
  onGroupDeleted?: (deletedGroupCode: string) => void;
}

export default function CodeGroupSection({
  selectedGroupCode,
  onSelectGroup,
  onGroupDeleted,
}: CodeGroupSectionProps) {
  const { showFeedback } = useAdminFeedback();
  const { codeGroups, isCodesLoading, isSaving, removeGroup, saveGroup } = useCodeGroupManagement();

  // 검색 상태 및 지연 평가(Deferred Value)
  const [groupSearch, setGroupSearch] = useState("");
  const deferredGroupSearch = useDeferredValue(groupSearch);

  // 인라인 그리드 편집 상태 훅
  const groupEdit = useInlineGridEdit<GroupAddForm, GroupEditForm>(
    INITIAL_GROUP_ADD_FORM,
    INITIAL_GROUP_EDIT_FORM,
  );

  // 필터링된 코드그룹 목록
  const filteredGroups = useMemo(() => {
    return codeGroups
      .filter((g) => {
        const query = deferredGroupSearch.toLowerCase().trim();
        if (!query) return true;
        return (
          g.groupCode.toLowerCase().includes(query) ||
          g.groupName.toLowerCase().includes(query) ||
          (g.remarks && g.remarks.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [codeGroups, deferredGroupSearch]);

  // 현재 선택된 코드그룹 객체
  const currentSelectedGroup = useMemo(() => {
    return codeGroups.find((g) => g.groupCode === selectedGroupCode) || null;
  }, [codeGroups, selectedGroupCode]);

  // 그룹 추가 시작
  const handleStartAddGroup = () => {
    const maxSort =
      codeGroups.length > 0
        ? Math.max(...codeGroups.map((g) => g.sortOrder || 0))
        : 0;
    groupEdit.startAdd({
      groupCode: "",
      groupName: "",
      remarks: "",
      sortOrder: maxSort + 1,
      isUse: true,
    });
  };

  // 그룹 저장 (DB POST - useAdminMutation 적용)
  const handleSaveInlineGroup = async () => {
    const groupCode = groupEdit.addForm.groupCode.trim().toUpperCase();
    const groupName = groupEdit.addForm.groupName.trim();

    if (!groupCode || !groupName) {
      showFeedback("그룹 코드와 그룹명을 모두 입력해주세요.");
      return;
    }

    const CODE_REGEX = /^[A-Z0-9_]+$/;
    if (!CODE_REGEX.test(groupCode)) {
      showFeedback(
        "그룹 코드는 영문 대문자, 숫자, 언더스코어(_)만 사용할 수 있습니다."
      );
      return;
    }

    if (codeGroups.some((g) => g.groupCode === groupCode)) {
      showFeedback(`이미 존재하는 그룹 코드 [${groupCode}] 입니다.`);
      return;
    }

    await saveGroup(
      { groupCode, groupName, remarks: groupEdit.addForm.remarks.trim(), sortOrder: Number(groupEdit.addForm.sortOrder) || 1, isUse: groupEdit.addForm.isUse },
      true,
      () => {
        onSelectGroup(groupCode);
        groupEdit.cancelAdd();
      },
    );
  };

  // 그룹 수정 시작
  const handleStartEditGroup = (group: CodeGroupItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    groupEdit.startEdit(group.groupCode, {
      groupName: group.groupName,
      remarks: group.remarks || "",
      sortOrder: group.sortOrder,
      isUse: group.isUse,
    });
  };

  // 그룹 수정 저장 (DB PUT - useAdminMutation 적용)
  const handleSaveInlineEditGroup = async () => {
    if (!groupEdit.editingId) return;
    const name = groupEdit.editForm.groupName.trim();

    if (!name) {
      showFeedback("그룹명을 입력해주세요.");
      return;
    }

    const editingGroupCode = groupEdit.editingId;

    await saveGroup(
      { groupCode: editingGroupCode, groupName: name, remarks: groupEdit.editForm.remarks.trim(), sortOrder: Number(groupEdit.editForm.sortOrder) || 1, isUse: groupEdit.editForm.isUse },
      false,
      () => groupEdit.cancelEdit(),
    );
  };

  // 그룹 삭제 (DB DELETE - useAdminMutation 적용)
  const handleDeleteGroup = async (group: CodeGroupItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        `[${group.groupName}(${group.groupCode})] 그룹을 삭제하시겠습니까?\n소속된 세부 코드도 함께 DB에서 영구 삭제됩니다.`
      )
    ) {
      return;
    }

    await removeGroup(group.groupCode, () => {
      if (selectedGroupCode === group.groupCode && onGroupDeleted) {
        onGroupDeleted(group.groupCode);
      }
      groupEdit.reset();
    });
  };

  return (
    <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col">
      <AdminCard
        title="공통코드 그룹 관리"
        countBadge={`총 ${filteredGroups.length}개 그룹`}
        className="h-full flex flex-col !p-4 md:!p-5"
        actions={
          <AdminGridHeaderActions
            isBusy={groupEdit.isBusy}
            hasSelection={!!currentSelectedGroup}
            onAdd={handleStartAddGroup}
            onEdit={() =>
              currentSelectedGroup && handleStartEditGroup(currentSelectedGroup)
            }
            onDelete={() =>
              currentSelectedGroup && handleDeleteGroup(currentSelectedGroup)
            }
            onCancel={() =>
              groupEdit.isAdding ? groupEdit.cancelAdd() : groupEdit.cancelEdit()
            }
            onSave={() =>
              groupEdit.isAdding
                ? handleSaveInlineGroup()
                : handleSaveInlineEditGroup()
            }
            addLabel="그룹 추가"
            saveDisabled={isSaving}
            saveLabel={isSaving ? "저장 중..." : "저장"}
          />
        }
      >
        {/* 상단 툴바: 검색 영역 */}
        <div className="flex items-center justify-between gap-3 mb-2.5 shrink-0">
          <div className="w-full max-w-xs sm:max-w-sm">
            <AdminSearchInput
              placeholder="그룹 코드 또는 그룹명 검색..."
              value={groupSearch}
              onChange={setGroupSearch}
            />
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
            {groupEdit.editingId
              ? "행 정보를 수정한 후 저장 또는 Enter를 누르세요. (식별자 그룹 코드는 수정 불가)"
              : groupEdit.isAdding
              ? "신규 행에 정보를 입력 후 저장 또는 Enter를 누르세요."
              : "행 클릭 시 선택되어 세부 코드가 조회됩니다. (수정 버튼으로 편집)"}
          </div>
        </div>

        {/* 코드그룹 테이블 그리드 */}
        <CodeGroupTable
          data={filteredGroups}
          selectedGroupCode={selectedGroupCode}
          isLoading={isCodesLoading}
          groupEdit={groupEdit}
          onSelectGroup={onSelectGroup}
          onSaveAdd={handleSaveInlineGroup}
          onSaveEdit={handleSaveInlineEditGroup}
        />
      </AdminCard>
    </div>
  );
}
