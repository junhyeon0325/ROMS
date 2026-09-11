// components/admin/AdminFormActions.tsx
/**
 * [관리자 폼 버튼 그룹 컴포넌트]
 * - 관리자 등록/수정 폼의 상·하단에 배치되는 공통 조작 버튼 모음
 * - 등록 모드와 수정 모드에 맞춰 [신규등록], [저장], [삭제] 버튼 제공
 */
import React from "react";

interface AdminFormActionsProps {
  onSave: () => void;
  onDelete?: () => void;
  onNew: () => void;
  saveLabel?: string;
  deleteLabel?: string;
  newLabel?: string;
  isEditing?: boolean;
}

export default function AdminFormActions({
  onSave,
  onDelete,
  onNew,
  saveLabel = "저장",
  deleteLabel = "삭제",
  newLabel = "+ 신규등록",
  isEditing = false,
}: AdminFormActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#f99e1a] hover:bg-[#ea8c08] text-slate-950 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
      >
        {saveLabel}
      </button>
      {isEditing && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {deleteLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNew}
        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {newLabel}
      </button>
    </div>
  );
}
