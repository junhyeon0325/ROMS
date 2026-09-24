// File: app/admin/components/DashboardMapPoolSection.tsx
// Page/Component: DashboardMapPoolSection
// Purpose: 관리자 대시보드의 공식 맵풀 요약과 맵 관리 화면 이동 UI를 표시한다.
"use client";

import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import type { MapItem } from "@/lib/types/maps";

interface DashboardMapPoolSectionProps {
  maps: MapItem[];
}

// 맵 목록의 빈 상태와 공식 맵풀 요약을 대시보드 카드로 표시한다.
export default function DashboardMapPoolSection({
  maps,
}: DashboardMapPoolSectionProps) {
  return (
    <AdminCard
      title={
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-4.5 h-4.5">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          </svg>
          <span>공식 지정 전장 맵풀 요약</span>
        </>
      }
      actions={
        <Link
          href="/admin/maps"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
        >
          전장 풀 관리 ({maps.length}종) →
        </Link>
      }
    >
      {maps.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
          <span className="text-2xl block mb-1">🗺️</span>
          지정된 공식 전장이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {maps.map((map) => (
            <div
              key={map.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                {map.mode}
              </span>
              <span className="truncate mx-1">{map.nameKr}</span>
              {map.isActive && <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>}
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 leading-relaxed">
        💡 <strong className="text-slate-800 dark:text-slate-200">러너리그 공식 맵풀</strong>에는 혼합, 호위, 쟁탈, 밀기, 플래시포인트 모드의 대표 전장 6종이 사전 승인되어 등록되어 있습니다.
      </div>
    </AdminCard>
  );
}
