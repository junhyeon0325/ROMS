// components/admin/AdminCard.tsx
/**
 * [관리자 카드 컨테이너 컴포넌트]
 * - 관리자 화면의 각 섹션(목록 테이블, 입력 폼 등)을 감싸는 공통 카드 박스 UI
 * - 타이틀, 개수 뱃지, 우측 조작 버튼 영역 및 내부 콘텐츠 배치 지원
 */
import React from "react";

interface AdminCardProps {
  title?: React.ReactNode;
  countBadge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function AdminCard({
  title,
  countBadge,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: AdminCardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col min-h-0 ${className}`}
    >
      {(title || countBadge || actions) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            {title && (
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {title}
              </div>
            )}
            {countBadge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {countBadge}
              </span>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={`flex-1 min-h-0 flex flex-col ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}

