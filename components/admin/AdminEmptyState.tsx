// components/admin/AdminEmptyState.tsx
/**
 * [관리자 공통 빈 데이터 안내 컴포넌트]
 * - 테이블 또는 목록이 비어있을 때 표시되는 표준화된 빈 상태 안내 UI
 * - table 요소 내부(colSpan 지정 시 tr/td 렌더링)와 일반 블록 div 컨테이너 모두 지원
 */
"use client";

import React from "react";

export interface AdminEmptyStateProps {
  /** 주요 안내 타이틀 */
  title: string;
  /** 상세 안내 서브 문구 (선택 사항) */
  description?: string;
  /** 안내 아이콘 (이모지 또는 ReactNode, 기본값: '📁') */
  icon?: React.ReactNode;
  /** 테이블 내부에서 사용할 경우 테이블 열(column) 개수 */
  colSpan?: number;
  /** 추가 컨테이너 클래스 */
  className?: string;
}

export default function AdminEmptyState({
  title,
  description,
  icon = "📁",
  colSpan,
  className = "",
}: AdminEmptyStateProps) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 py-8 text-center text-slate-400 ${className}`}
    >
      <span className="text-2xl select-none mb-0.5">{icon}</span>
      <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
        {title}
      </p>
      {description && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
          {description}
        </p>
      )}
    </div>
  );

  if (typeof colSpan === "number") {
    return (
      <tr>
        <td colSpan={colSpan} className="px-3.5 py-8 text-center">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}
