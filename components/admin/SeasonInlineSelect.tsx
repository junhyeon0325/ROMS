// File: components/admin/SeasonInlineSelect.tsx
// Page/Component: SeasonInlineSelect
// Purpose: 대회별 관리자 화면에서 모달 없이 대회를 직접 선택하고 변경한다.
"use client";

import type { SeasonItem } from "@/lib/types/admin";

interface SeasonInlineSelectProps {
  seasons: SeasonItem[];
  value: string;
  onChange: (seasonId: string) => void;
  disabled?: boolean;
  prominent?: boolean;
}

// 등록된 대회 목록을 현재 화면에서 바로 선택할 수 있는 드롭다운으로 제공한다.
export default function SeasonInlineSelect({ seasons, value, onChange, disabled = false, prominent = false }: SeasonInlineSelectProps) {
  return <select
    aria-label="대회 선택"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    className={`max-w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 ${prominent ? "min-w-48 border-amber-500" : "border-slate-200 dark:border-slate-700"}`}
  >
    <option value="" disabled>대회를 선택하세요</option>
    {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
  </select>;
}
