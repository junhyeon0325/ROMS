// File: app/admin/codes/components/CodeGroupTable.tsx
// Page/Component: CodeGroupTable
// Purpose: 코드 그룹 목록의 선택, 추가, 인라인 수정 표시 영역을 렌더링하고 상위 섹션의 편집 상태와 이벤트를 연결한다.
"use client";

import type React from "react";
import AdminTable from "@/components/admin/AdminTable";
import type { CodeGroupItem } from "@/lib/types/codes";
import type { UseInlineGridEditReturn } from "@/lib/hooks/useInlineGridEdit";
import type { GroupAddForm, GroupEditForm } from "./codeFormState";
import { createGroupColumns } from "./codeTableColumns";

interface CodeGroupTableProps {
  data: CodeGroupItem[];
  selectedGroupCode: string;
  isLoading: boolean;
  groupEdit: UseInlineGridEditReturn<GroupAddForm, GroupEditForm>;
  onSelectGroup: (groupCode: string) => void;
  onSaveAdd: () => void;
  onSaveEdit: () => void;
}

// 코드 그룹 테이블의 행 선택과 인라인 편집 UI를 기존 편집 상태에 연결한다.
export default function CodeGroupTable({
  data,
  selectedGroupCode,
  isLoading,
  groupEdit,
  onSelectGroup,
  onSaveAdd,
  onSaveEdit,
}: CodeGroupTableProps) {
  const groupColumns = createGroupColumns();

  // Enter와 Escape 입력을 저장 또는 현재 편집 취소 동작으로 연결한다.
  const handleAddKeyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") { event.preventDefault(); onSaveAdd(); }
    if (event.key === "Escape") groupEdit.cancelAdd();
  };
  const handleEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") { event.preventDefault(); onSaveEdit(); }
    if (event.key === "Escape") groupEdit.cancelEdit();
  };

  return (
    <AdminTable<CodeGroupItem>
      columns={groupColumns}
      data={data}
      keyField="groupCode"
      selectedId={selectedGroupCode}
      onRowClick={(row) => onSelectGroup(row.groupCode)}
      isLoading={isLoading}
      emptyTitle="검색된 코드그룹이 없습니다."
      topRow={
        groupEdit.isAdding ? (
          <tr className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150">
            <td className="px-2 py-2 text-center whitespace-nowrap"><span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">NEW</span></td>
            <td className="px-2 py-1.5"><input type="text" autoFocus placeholder="예: MEMBER_ROLE" className="w-full px-2 py-1 text-xs font-mono font-bold uppercase rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-[#f99e1a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/30 shadow-2xs" value={groupEdit.addForm.groupCode} onChange={(event) => groupEdit.updateAddForm({ groupCode: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} onKeyDown={handleAddKeyDown} /></td>
            <td className="px-2 py-1.5"><input type="text" placeholder="예: 참가자의 역할 구분" className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a] focus:ring-1 focus:ring-[#f99e1a]" value={groupEdit.addForm.groupName} onChange={(event) => groupEdit.updateAddForm({ groupName: event.target.value })} onKeyDown={handleAddKeyDown} /></td>
            <td className="px-2 py-1.5 text-center"><input type="number" min="0" className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#f99e1a]" value={groupEdit.addForm.sortOrder} onChange={(event) => groupEdit.updateAddForm({ sortOrder: Number(event.target.value) || 0 })} onKeyDown={handleAddKeyDown} /></td>
            <td className="px-2 py-1.5 text-center"><select className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]" value={groupEdit.addForm.isUse ? "Y" : "N"} onChange={(event) => groupEdit.updateAddForm({ isUse: event.target.value === "Y" })}><option value="Y">사용</option><option value="N">미사용</option></select></td>
            <td className="px-2 py-1.5"><input type="text" placeholder="설명 / 비고 입력..." className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]" value={groupEdit.addForm.remarks} onChange={(event) => groupEdit.updateAddForm({ remarks: event.target.value })} onKeyDown={handleAddKeyDown} /></td>
          </tr>
        ) : null
      }
      renderRow={(group) => {
        if (!groupEdit.isEditing(group.groupCode)) return null;
        return (
          <tr key={group.groupCode} className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150">
            <td className="px-2 py-2 text-center whitespace-nowrap"><span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">수정</span></td>
            <td className="px-3.5 py-2 font-mono font-bold text-slate-400 dark:text-slate-500"><div className="flex items-center gap-1.5" title="식별자 불변 규칙: 그룹 코드는 수정할 수 없습니다."><span>{group.groupCode}</span><span className="text-[10px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans font-normal">고정</span></div></td>
            <td className="px-2 py-1.5"><input type="text" autoFocus placeholder="그룹명 입력" className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]" value={groupEdit.editForm.groupName} onChange={(event) => groupEdit.updateEditForm({ groupName: event.target.value })} onKeyDown={handleEditKeyDown} /></td>
            <td className="px-2 py-1.5 text-center"><input type="number" min="0" className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]" value={groupEdit.editForm.sortOrder} onChange={(event) => groupEdit.updateEditForm({ sortOrder: Number(event.target.value) || 0 })} onKeyDown={handleEditKeyDown} /></td>
            <td className="px-2 py-1.5 text-center"><select className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]" value={groupEdit.editForm.isUse ? "Y" : "N"} onChange={(event) => groupEdit.updateEditForm({ isUse: event.target.value === "Y" })}><option value="Y">사용</option><option value="N">미사용</option></select></td>
            <td className="px-2 py-1.5"><input type="text" placeholder="설명 / 비고" className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]" value={groupEdit.editForm.remarks} onChange={(event) => groupEdit.updateEditForm({ remarks: event.target.value })} onKeyDown={handleEditKeyDown} /></td>
          </tr>
        );
      }}
    />
  );
}
