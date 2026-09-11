// components/layout/UserFooter.tsx
/**
 * [사용자 푸터 컴포넌트]
 * - 사용자 메인 화면 하단에 고정되는 푸터 바
 * - 시스템 명칭, 버전(v1.0), 저작권 정보 표기
 */
"use client";

import React from "react";

export default function UserFooter() {
  return (
    <footer className="sticky bottom-0 z-20 w-full bg-[#FAFAF7]/90 dark:bg-[#0B0E14]/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 py-3 px-6 md:px-12 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 select-none transition-colors">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          ROMS · 러너리그 오버워치 전적 시스템
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-normal">
        <span>Runner-league Overwatch Management System v1.0</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">All Rights Reserved</span>
      </div>
    </footer>
  );
}
