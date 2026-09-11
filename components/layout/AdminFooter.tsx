// components/layout/AdminFooter.tsx
/**
 * [관리자 푸터 컴포넌트]
 * - 관리자 화면 하단에 고정되는 상태 표시 바
 * - 현재 작업 중인 메뉴 위치, 시스템 통신/연결 상태 및 버전 정보 표기
 */
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";

export default function AdminFooter() {
  const pathname = usePathname();

  // 현재 경로 기반 페이지 라벨 매핑
  const getCurrentPageLabel = () => {
    if (pathname === "/admin") {
      return "통합 관리자 관제 센터";
    }

    for (const group of ADMIN_NAV_ITEMS) {
      if (group.children) {
        for (const sub of group.children) {
          if (sub.href === pathname) {
            return sub.label;
          }
        }
      } else if (group.href === pathname) {
        return group.label;
      }
    }

    if (pathname.startsWith("/admin/tournaments/structure")) {
      return "대회 구성 관리";
    }
    if (pathname.startsWith("/admin/tournaments")) {
      return "대회 등록";
    }

    return "관리자 시스템";
  };

  const pageLabel = getCurrentPageLabel();

  return (
    <footer className="sticky bottom-0 z-20 w-full bg-white/90 dark:bg-[#111726]/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 py-3 px-6 md:px-8 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 select-none transition-colors">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          ROMS · {pageLabel}
        </span>
        <span className="hidden md:inline-block text-[10px] font-mono text-slate-400 dark:text-slate-600">
          |
        </span>
        <span className="hidden md:inline-block text-[11px] text-slate-400 dark:text-slate-500">
          실시간 관제 활성 (Online)
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-normal">
        <span>Runner-league Overwatch Management System Admin Suite v1.0</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">All Rights Reserved</span>
      </div>
    </footer>
  );
}
