// components/admin/AdminGridHeaderActions.tsx
/**
 * [인라인 그리드 헤더 액션 바 컴포넌트]
 * - 인라인 편집 테이블의 상단 카드 헤더 우측에 배치되는 공통 조작 버튼 모음
 * - 평상시: [수정] [삭제] [추가]
 * - 인라인 편집/추가 진행 중(isBusy): [취소] [저장]
 */
"use client";

import React from "react";

export interface AdminGridHeaderActionsProps {
  /** 현재 신규 추가 또는 행 수정이 진행 중인지 여부 */
  isBusy: boolean;
  /** 현재 행 선택이 되어 있는지 여부 (수정/삭제 버튼 활성화 기준) */
  hasSelection: boolean;
  /** 추가 버튼 클릭 핸들러 */
  onAdd: () => void;
  /** 수정 버튼 클릭 핸들러 */
  onEdit: () => void;
  /** 삭제 버튼 클릭 핸들러 */
  onDelete: () => void;
  /** 인라인 추가/수정 취소 핸들러 */
  onCancel: () => void;
  /** 인라인 추가/수정 저장 핸들러 */
  onSave: () => void;
  /** 추가 버튼 라벨 (기본값: '+ 추가') */
  addLabel?: string;
  /** 수정 버튼 라벨 (기본값: '수정') */
  editLabel?: string;
  /** 삭제 버튼 라벨 (기본값: '삭제') */
  deleteLabel?: string;
  /** 취소 버튼 라벨 (기본값: '취소') */
  cancelLabel?: string;
  /** 저장 버튼 라벨 (기본값: '저장') */
  saveLabel?: string;
  /** 저장 버튼 비활성화 여부 */
  saveDisabled?: boolean;
}

export default function AdminGridHeaderActions({
  isBusy,
  hasSelection,
  onAdd,
  onEdit,
  onDelete,
  onCancel,
  onSave,
  addLabel = "+ 추가",
  editLabel = "수정",
  deleteLabel = "삭제",
  cancelLabel = "취소",
  saveLabel = "저장",
  saveDisabled = false,
}: AdminGridHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {isBusy ? (
        /* 인라인 편집/추가 진행 중일 때: 취소 / 저장 버튼 */
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <span>{cancelLabel}</span>
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f99e1a] text-slate-950 hover:bg-[#e08a10] active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{saveLabel}</span>
          </button>
        </div>
      ) : (
        /* 평상시: 수정 / 삭제 / 추가 버튼 */
        <>
          <button
            type="button"
            disabled={!hasSelection}
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span>{editLabel}</span>
          </button>

          <button
            type="button"
            disabled={!hasSelection}
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>{deleteLabel}</span>
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f99e1a] text-slate-950 hover:bg-[#e08a10] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>{addLabel}</span>
          </button>
        </>
      )}
    </div>
  );
}
