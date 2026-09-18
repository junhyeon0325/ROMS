// app/admin/codes/components/CodeGroupSection.tsx
/**
 * [공통코드 그룹 관리 그리드 섹션 컴포넌트]
 * - 상단 50% 영역 전담
 * - 그룹 목록 조회, 검색(useDeferredValue), 인라인 추가/수정/삭제
 * - 하단 세부코드와의 렌더링 격리 및 식별자(PK) 자동 마스킹
 */
"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { CodeGroupItem } from "@/lib/types/admin";
import AdminCard from "@/components/admin/AdminCard";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminGridHeaderActions from "@/components/admin/AdminGridHeaderActions";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import { useInlineGridEdit } from "@/lib/hooks/useInlineGridEdit";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";

// 코드그룹 폼 인터페이스
interface GroupAddForm {
  groupCode: string;
  groupName: string;
  remarks: string;
  sortOrder: number;
  isUse: boolean;
}

interface GroupEditForm {
  groupName: string;
  remarks: string;
  sortOrder: number;
  isUse: boolean;
}

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
  const { codeGroups, refreshCodes, showFeedback, isCodesLoading } = useAdmin();

  // 저장/삭제 API 요청 훅 (중복 클릭 방지 및 피드백 캡슐화)
  const { execute: mutateGroup, isPending: isSaving } = useAdminMutation();

  // 검색 상태 및 지연 평가(Deferred Value)
  const [groupSearch, setGroupSearch] = useState("");
  const deferredGroupSearch = useDeferredValue(groupSearch);

  // 인라인 그리드 편집 상태 훅
  const groupEdit = useInlineGridEdit<GroupAddForm, GroupEditForm>(
    {
      groupCode: "",
      groupName: "",
      remarks: "",
      sortOrder: 1,
      isUse: true,
    },
    {
      groupName: "",
      remarks: "",
      sortOrder: 1,
      isUse: true,
    }
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

  // 테이블 컬럼 정의
  const groupColumns: AdminTableColumn<CodeGroupItem>[] = useMemo(
    () => [
      {
        key: "index",
        header: "순번",
        width: "w-14 min-w-[56px]",
        align: "center",
        render: (_row, idx) => (
          <span className="text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
            {idx + 1}
          </span>
        ),
      },
      {
        key: "groupCode",
        header: "그룹 코드",
        width: "w-44",
        render: (row) => (
          <span className="font-mono font-bold text-[#f99e1a] dark:text-amber-400">
            {row.groupCode}
          </span>
        ),
      },
      {
        key: "groupName",
        header: "그룹명",
        width: "w-52",
        render: (row) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {row.groupName}
          </span>
        ),
      },
      {
        key: "sortOrder",
        header: "순서",
        width: "w-20 min-w-[70px]",
        align: "center",
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {row.sortOrder}
          </span>
        ),
      },
      {
        key: "isUse",
        header: "사용여부",
        width: "w-24",
        render: (row) => <AdminBadge status={row.isUse} />,
      },
      {
        key: "remarks",
        header: "설명 / 비고",
        render: (row) => (
          <span
            className="text-slate-500 dark:text-slate-400 truncate max-w-xs block"
            title={row.remarks}
          >
            {row.remarks || "—"}
          </span>
        ),
      },
    ],
    []
  );

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

    await mutateGroup(
      async () => {
        const res = await fetch("/api/codes/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupCode,
            groupName,
            remarks: groupEdit.addForm.remarks.trim(),
            sortOrder: Number(groupEdit.addForm.sortOrder) || 1,
            isUse: groupEdit.addForm.isUse,
          }),
        });
        return res.json();
      },
      {
        successMessage: `신규 그룹 [${groupCode}]이(가) DB에 등록되었습니다.`,
        errorMessage: "그룹 등록에 실패했습니다.",
        onSuccess: async () => {
          await refreshCodes();
          onSelectGroup(groupCode);
          groupEdit.cancelAdd();
        },
      }
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

    await mutateGroup(
      async () => {
        const res = await fetch("/api/codes/groups", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupCode: editingGroupCode,
            groupName: name,
            remarks: groupEdit.editForm.remarks.trim(),
            sortOrder: Number(groupEdit.editForm.sortOrder) || 1,
            isUse: groupEdit.editForm.isUse,
          }),
        });
        return res.json();
      },
      {
        successMessage: `그룹 [${editingGroupCode}] 정보가 수정되었습니다.`,
        errorMessage: "그룹 수정에 실패했습니다.",
        onSuccess: async () => {
          await refreshCodes();
          groupEdit.cancelEdit();
        },
      }
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

    await mutateGroup(
      async () => {
        const res = await fetch(
          `/api/codes/groups?groupCode=${encodeURIComponent(group.groupCode)}`,
          { method: "DELETE" }
        );
        return res.json();
      },
      {
        successMessage: `그룹 [${group.groupCode}]이(가) 삭제되었습니다.`,
        errorMessage: "그룹 삭제에 실패했습니다.",
        onSuccess: async () => {
          await refreshCodes();
          if (selectedGroupCode === group.groupCode && onGroupDeleted) {
            onGroupDeleted(group.groupCode);
          }
          groupEdit.reset();
        },
      }
    );
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
        <AdminTable<CodeGroupItem>
          columns={groupColumns}
          data={filteredGroups}
          keyField="groupCode"
          selectedId={selectedGroupCode}
          onRowClick={(row) => onSelectGroup(row.groupCode)}
          isLoading={isCodesLoading}
          emptyTitle="검색된 코드그룹이 없습니다."
          topRow={
            groupEdit.isAdding ? (
              <tr className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150">
                <td className="px-2 py-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">
                    NEW
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="예: MEMBER_ROLE"
                    className="w-full px-2 py-1 text-xs font-mono font-bold uppercase rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-[#f99e1a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/30 shadow-2xs"
                    value={groupEdit.addForm.groupCode}
                    onChange={(e) =>
                      groupEdit.updateAddForm({
                        groupCode: e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9_]/g, ""),
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveInlineGroup();
                      }
                      if (e.key === "Escape") groupEdit.cancelAdd();
                    }}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="예: 참가자 역할 구분"
                    className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a] focus:ring-1 focus:ring-[#f99e1a]"
                    value={groupEdit.addForm.groupName}
                    onChange={(e) =>
                      groupEdit.updateAddForm({ groupName: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveInlineGroup();
                      }
                      if (e.key === "Escape") groupEdit.cancelAdd();
                    }}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    min="0"
                    className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#f99e1a]"
                    value={groupEdit.addForm.sortOrder}
                    onChange={(e) =>
                      groupEdit.updateAddForm({
                        sortOrder: Number(e.target.value) || 0,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveInlineGroup();
                      }
                      if (e.key === "Escape") groupEdit.cancelAdd();
                    }}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <select
                    className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                    value={groupEdit.addForm.isUse ? "Y" : "N"}
                    onChange={(e) =>
                      groupEdit.updateAddForm({ isUse: e.target.value === "Y" })
                    }
                  >
                    <option value="Y">사용</option>
                    <option value="N">미사용</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="설명 / 비고 입력..."
                    className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                    value={groupEdit.addForm.remarks}
                    onChange={(e) =>
                      groupEdit.updateAddForm({ remarks: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveInlineGroup();
                      }
                      if (e.key === "Escape") groupEdit.cancelAdd();
                    }}
                  />
                </td>
              </tr>
            ) : null
          }
          renderRow={(g) => {
            if (!groupEdit.isEditing(g.groupCode)) return null;
            return (
              <tr
                key={g.groupCode}
                className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150"
              >
                <td className="px-2 py-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">
                    수정
                  </span>
                </td>
                <td className="px-3.5 py-2 font-mono font-bold text-slate-400 dark:text-slate-500">
                  <div
                    className="flex items-center gap-1.5"
                    title="식별자 불변 원칙: 그룹 코드는 수정할 수 없습니다."
                  >
                    <span>{g.groupCode}</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans font-normal">
                      고정
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="그룹명 입력"
                    className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]"
                    value={groupEdit.editForm.groupName}
                    onChange={(e) =>
                      groupEdit.updateEditForm({ groupName: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveInlineEditGroup();
                      }
                      if (e.key === "Escape") groupEdit.cancelEdit();
                    }}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    min="0"
                    className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]"
                    value={groupEdit.editForm.sortOrder}
                    onChange={(e) =>
                      groupEdit.updateEditForm({
                        sortOrder: Number(e.target.value) || 0,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveInlineEditGroup();
                      }
                      if (e.key === "Escape") groupEdit.cancelEdit();
                    }}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <select
                    className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                    value={groupEdit.editForm.isUse ? "Y" : "N"}
                    onChange={(e) =>
                      groupEdit.updateEditForm({ isUse: e.target.value === "Y" })
                    }
                  >
                    <option value="Y">사용</option>
                    <option value="N">미사용</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="설명 / 비고"
                    className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                    value={groupEdit.editForm.remarks}
                    onChange={(e) =>
                      groupEdit.updateEditForm({ remarks: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveInlineEditGroup();
                      }
                      if (e.key === "Escape") groupEdit.cancelEdit();
                    }}
                  />
                </td>
              </tr>
            );
          }}
        />
      </AdminCard>
    </div>
  );
}
