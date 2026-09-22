// File: app/admin/codes/components/DetailCodeTable.tsx
// Page/Component: DetailCodeTable
// Purpose: 상세 코드 목록, 선택 상태, 인라인 추가·수정 행을 표시하고 상위 섹션의 편집 상태와 저장 이벤트를 연결한다.
"use client";

import type React from "react";
import AdminTable from "@/components/admin/AdminTable";
import type { UseInlineGridEditReturn } from "@/lib/hooks/useInlineGridEdit";
import type { CodeItem } from "@/lib/types/codes";
import type { CodeAddForm, CodeEditForm } from "./codeFormState";
import { createCodeColumns } from "./codeTableColumns";

interface DetailCodeTableProps {
  data: CodeItem[];
  selectedGroupCode: string;
  selectedCode: string | null;
  isLoading: boolean;
  codeEdit: UseInlineGridEditReturn<CodeAddForm, CodeEditForm>;
  onSelectCode: (code: string) => void;
  onSaveAdd: () => void;
  onSaveEdit: () => void;
}

// 상세 코드 테이블의 선택 및 인라인 편집 UI를 기존 편집 상태에 연결한다.
export default function DetailCodeTable({
  data, selectedGroupCode, selectedCode, isLoading, codeEdit, onSelectCode, onSaveAdd, onSaveEdit,
}: DetailCodeTableProps) {
  const codeColumns = createCodeColumns();

  // Enter와 Escape 입력을 저장 또는 현재 편집 취소 동작으로 연결한다.
  const handleAddKeyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") { event.preventDefault(); onSaveAdd(); }
    if (event.key === "Escape") codeEdit.cancelAdd();
  };
  const handleEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") { event.preventDefault(); onSaveEdit(); }
    if (event.key === "Escape") codeEdit.cancelEdit();
  };

  return (
    <AdminTable<CodeItem>
      columns={codeColumns}
      data={data}
      keyField="code"
      selectedId={selectedCode}
      onRowClick={(row) => onSelectCode(row.code)}
      isLoading={isLoading}
      emptyIcon={!selectedGroupCode ? "👆" : "⚙️"}
      emptyTitle={!selectedGroupCode ? "상단 그리드에서 코드 그룹을 먼저 선택해주세요." : "등록된 세부 코드가 없습니다."}
      emptyDescription={!selectedGroupCode ? undefined : "우측 상단의 '+ 코드 등록' 버튼을 눌러 새로운 코드를 등록해주세요."}
      topRow={codeEdit.isAdding ? (
        <tr className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150">
          <td className="px-2 py-2 text-center whitespace-nowrap"><span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">NEW</span></td>
          <td className="px-2 py-1.5"><input type="text" autoFocus placeholder="예: ROLE_DPS" className="w-full px-2 py-1 text-xs font-mono font-bold uppercase rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-[#f99e1a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/30 shadow-2xs" value={codeEdit.addForm.code} onChange={(event) => codeEdit.updateAddForm({ code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} onKeyDown={handleAddKeyDown} /></td>
          <td className="px-2 py-1.5"><input type="text" placeholder="예: 딜러 (공격군)" className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a] focus:ring-1 focus:ring-[#f99e1a]" value={codeEdit.addForm.name} onChange={(event) => codeEdit.updateAddForm({ name: event.target.value })} onKeyDown={handleAddKeyDown} /></td>
          <td className="px-2 py-1.5 text-center"><input type="number" min="0" className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#f99e1a]" value={codeEdit.addForm.sortOrder} onChange={(event) => codeEdit.updateAddForm({ sortOrder: Number(event.target.value) || 0 })} onKeyDown={handleAddKeyDown} /></td>
          <td className="px-2 py-1.5 text-center"><select className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]" value={codeEdit.addForm.isUse ? "Y" : "N"} onChange={(event) => codeEdit.updateAddForm({ isUse: event.target.value === "Y" })}><option value="Y">사용</option><option value="N">미사용</option></select></td>
          <td className="px-2 py-1.5"><input type="text" placeholder="코드 설명 및 비고 입력..." className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]" value={codeEdit.addForm.remarks} onChange={(event) => codeEdit.updateAddForm({ remarks: event.target.value })} onKeyDown={handleAddKeyDown} /></td>
        </tr>
      ) : null}
      renderRow={(codeItem) => {
        if (!codeEdit.isEditing(codeItem.code)) return null;
        return (
          <tr key={codeItem.code} className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150">
            <td className="px-2 py-2 text-center whitespace-nowrap"><span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">수정</span></td>
            <td className="px-3.5 py-2 font-mono font-bold text-slate-400 dark:text-slate-500"><div className="flex items-center gap-1.5" title="식별자 불변 원칙: 세부 코드 ID는 수정할 수 없습니다."><span>{codeItem.code}</span><span className="text-[10px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans font-normal">고정</span></div></td>
            <td className="px-2 py-1.5"><input type="text" autoFocus placeholder="코드명" className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]" value={codeEdit.editForm.name} onChange={(event) => codeEdit.updateEditForm({ name: event.target.value })} onKeyDown={handleEditKeyDown} /></td>
            <td className="px-2 py-1.5 text-center"><input type="number" min="0" className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]" value={codeEdit.editForm.sortOrder} onChange={(event) => codeEdit.updateEditForm({ sortOrder: Number(event.target.value) || 0 })} onKeyDown={handleEditKeyDown} /></td>
            <td className="px-2 py-1.5 text-center"><select className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]" value={codeEdit.editForm.isUse ? "Y" : "N"} onChange={(event) => codeEdit.updateEditForm({ isUse: event.target.value === "Y" })}><option value="Y">사용</option><option value="N">미사용</option></select></td>
            <td className="px-2 py-1.5"><input type="text" placeholder="코드 설명 / 비고..." className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]" value={codeEdit.editForm.remarks} onChange={(event) => codeEdit.updateEditForm({ remarks: event.target.value })} onKeyDown={handleEditKeyDown} /></td>
          </tr>
        );
      }}
    />
  );
}
