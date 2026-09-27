// File: components/admin/AdminMultiFilterTabs.tsx
// Page/Component: AdminMultiFilterTabs
// Purpose: 전체 해제와 개별 토글을 지원하는 관리자 다중 선택 필터를 표시한다.
"use client";

import type { FilterTabOption } from "./AdminFilterTabs";

interface AdminMultiFilterTabsProps {
  label: string;
  tabs: FilterTabOption[];
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  containerClassName?: string;
}

// 빈 선택을 전체로 표시하고 개별 코드는 독립적으로 켜거나 끈다.
export default function AdminMultiFilterTabs({ label, tabs, selectedCodes, onChange, containerClassName = "" }: AdminMultiFilterTabsProps) {
  return (
    <div className={containerClassName}>
      <div className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</div>
      <div className="flex h-[30px] items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900" role="group" aria-label={label}>
        {tabs.map((tab) => {
          const isActive = tab.code === "ALL" ? selectedCodes.length === 0 : selectedCodes.includes(tab.code);
          return (
            <button
              key={tab.code}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(tab.code === "ALL" ? [] : isActive ? selectedCodes.filter((code) => code !== tab.code) : [...selectedCodes, tab.code])}
              className={`flex h-full flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-1 text-[11px] font-semibold transition-all ${isActive ? "bg-[#f99e1a] font-bold text-slate-950 shadow-xs" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
