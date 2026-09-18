// File: components/admin/AdminFilterPanel.tsx
// Page/Component: AdminFilterPanel
// Purpose: 관리자 목록 페이지의 검색·필터 컨트롤을 동일한 여백과 반응형 12열 그리드로 배치한다.
"use client";

import { ReactNode } from "react";

interface AdminFilterPanelProps {
  children: ReactNode;
}

// 검색 입력과 필터 탭을 공통 컨테이너에 배치해 목록별 UI 편차를 없앤다.
export default function AdminFilterPanel({ children }: AdminFilterPanelProps) {
  return (
    <div className="mb-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12">{children}</div>
    </div>
  );
}
