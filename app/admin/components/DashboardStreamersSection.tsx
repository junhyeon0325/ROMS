// File: app/admin/components/DashboardStreamersSection.tsx
// Page/Component: DashboardStreamersSection
// Purpose: 관리자 대시보드의 최근 등록 스트리머 목록과 관리 화면 이동 UI를 표시한다.
"use client";

import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import type { StreamerItem } from "@/lib/types/streamers";

interface DashboardStreamersSectionProps {
  streamers: StreamerItem[];
}

// 스트리머 목록의 빈 상태와 등록 정보를 대시보드 카드로 표시한다.
export default function DashboardStreamersSection({
  streamers,
}: DashboardStreamersSectionProps) {
  return (
    <AdminCard
      title={
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="#F99E1A" strokeWidth="2" className="w-4.5 h-4.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>최근 등록 인원 (팀장 · 선수 · 감독)</span>
        </>
      }
      actions={
        <Link
          href="/admin/streamers"
          className="text-xs font-semibold text-[#f99e1a] dark:text-amber-400 hover:text-[#ea8c08] dark:hover:text-amber-300 hover:underline transition-colors"
        >
          전체 관리 ({streamers.length}명) →
        </Link>
      }
    >
      {streamers.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
          <span className="text-2xl block mb-1">👤</span>
          등록된 스트리머가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
          {streamers.map((streamer) => (
            <Link
              key={streamer.id}
              href="/admin/streamers"
              className="group flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              title="클릭하여 상세 정보 조회 및 수정"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                  {streamer.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span>{streamer.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        streamer.channelId
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {streamer.channelId ? "치지직 연동" : "일반 등록"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {streamer.id} {streamer.channelId ? `· @${streamer.channelId}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {streamer.roles && streamer.roles.length > 0 ? (
                  streamer.roles.map((role) => (
                    <span
                      key={role}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {streamer.registeredDate}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminCard>
  );
}
