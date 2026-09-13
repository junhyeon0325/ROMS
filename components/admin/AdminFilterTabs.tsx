// components/admin/AdminFilterTabs.tsx
/**
 * [관리자 필터 탭 버튼 그룹 컴포넌트]
 * - 원클릭으로 필터링 조건을 전환할 수 있는 직관적인 탭 버튼 UI
 * - 검색 인풋 높이(h-[30px])와 완벽하게 일치하여 폼 필터 영역의 통일감 유지
 */
"use client";

import React from "react";

export interface FilterTabOption {
  code: string;
  name: string;
}

export interface AdminFilterTabsProps {
  /** 상단 라벨 문구 (선택 사항, 예: '구분', '역할군') */
  label?: string;
  /** 탭 옵션 목록 (code: 고유 식별값, name: 화면 노출명) */
  tabs: FilterTabOption[];
  /** 현재 활성화된 탭의 code */
  activeTab: string;
  /** 탭 클릭 시 이벤트 핸들러 */
  onChange: (code: string) => void;
  /** 전체 컨테이너 추가 클래스 */
  containerClassName?: string;
  /** 탭 버튼 바 컨테이너 높이 클래스 (기본값: 'h-[30px]') */
  heightClass?: string;
}

export default function AdminFilterTabs({
  label,
  tabs,
  activeTab,
  onChange,
  containerClassName = "",
  heightClass = "h-[30px]",
}: AdminFilterTabsProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </label>
        </div>
      )}
      <div
        className={`flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ${heightClass}`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.code;
          return (
            <button
              key={tab.code}
              type="button"
              onClick={() => onChange(tab.code)}
              className={`flex-1 h-full px-1 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#f99e1a] text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
