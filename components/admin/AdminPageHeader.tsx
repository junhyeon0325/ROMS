// components/admin/AdminPageHeader.tsx
/**
 * [관리자 페이지 헤더 컴포넌트]
 * - 관리자 각 서브 페이지 최상단에 배치되는 공통 타이틀 영역
 * - 페이지 대제목(H1), 상세 설명 안내 문구, 우측 조작 버튼(Children) 배치 지원
 */
import React from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80 dark:border-slate-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
