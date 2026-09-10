// components/layout/AdminHeader.tsx
// 관리자 공통 상단 헤더 (메뉴 검색 및 전역 토스트 알림)
"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdmin } from "@/lib/context/AdminContext";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { menuSearchQuery, setMenuSearchQuery, toastMessage } = useAdmin();

  // 브레드크럼 매핑 계산
  const getBreadcrumbs = () => {
    if (pathname === "/admin") {
      return ["ROMS 시스템 관리", "대시보드"];
    }
    if (pathname === "/admin/tournaments") {
      return ["공통관리", "대회등록"];
    }
    if (pathname === "/admin/members") {
      return ["공통관리", "팀장·선수·감독 등록"];
    }
    if (pathname === "/admin/maps") {
      return ["공통관리", "맵(전장) 등록"];
    }
    if (pathname === "/admin/codes") {
      return ["공통관리", "공통코드 관리"];
    }

    // fallback 매핑
    for (const group of ADMIN_NAV_ITEMS) {
      if (group.children) {
        for (const sub of group.children) {
          if (sub.href === pathname) {
            return [group.label, sub.label];
          }
        }
      } else if (group.href === pathname) {
        return [group.label];
      }
    }
    return ["공통관리", "대회등록"];
  };

  const breadcrumbs = getBreadcrumbs();

  // 검색 가능한 전체 메뉴 평탄화
  const allNavLinks: { label: string; href: string }[] = [];
  ADMIN_NAV_ITEMS.forEach((item) => {
    if (item.children) {
      item.children.forEach((sub) => {
        if (sub.href) allNavLinks.push({ label: sub.label, href: sub.href });
      });
    } else if (item.href) {
      allNavLinks.push({ label: item.label, href: item.href });
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && menuSearchQuery.trim()) {
      const match = allNavLinks.find((m) =>
        m.label.toLowerCase().includes(menuSearchQuery.trim().toLowerCase()),
      );
      if (match) {
        router.push(match.href);
      }
    }
  };

  return (
    <>
      <header className="h-16 px-6 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111726]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs md:max-w-sm">
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-inner"
            placeholder="메뉴 검색 (예: 대회, 맵, 팀장, 코드...)"
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* 메뉴 검색 라인 우측 사이드 브레드크럼 */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300 dark:text-slate-600 font-mono text-[10px]">&gt;</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? "font-semibold text-slate-800 dark:text-slate-200"
                    : "text-slate-500 dark:text-slate-400"
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* 전역 토스트 피드백 알림 */}
      {toastMessage && (
        <div className="fixed top-6 right-8 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-5 py-3 rounded-xl text-xs font-bold shadow-2xl z-50 transition-all border border-slate-700 dark:border-slate-300 flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400 dark:text-emerald-600 font-black">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
