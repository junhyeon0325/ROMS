// components/layout/AdminSidebar.tsx
// 관리자 사이드바
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { useAdmin } from "@/lib/context/AdminContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { menuSearchQuery, isDarkMode, toggleDarkMode } = useAdmin();

  // 대메뉴 접기/펼치기 상태 관리 (기본적으로 모두 펼침)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    common: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // 메뉴 검색 필터링 검사
  const isMatchSearch = (label: string) => {
    if (!menuSearchQuery.trim()) return true;
    return label.toLowerCase().includes(menuSearchQuery.trim().toLowerCase());
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#111726] border-r border-slate-200 dark:border-slate-800 flex flex-col p-5 md:p-6 sticky top-0 h-screen shrink-0 z-30 justify-between">
      {/* 1) 브랜드 로고 */}
      <div>
        <Link
          href="/admin"
          className="font-black text-xl tracking-tight mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1 text-slate-900 dark:text-white"
          title="관리자 대시보드로 이동"
        >
          RO<span className="text-blue-600">MS</span>{" "}
          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900 ml-1.5">
            ADMIN
          </span>
        </Link>

        {/* 2) 네비게이션 메뉴 */}
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            // 하위 메뉴가 있는 대메뉴 그룹인 경우
            if (item.children && item.children.length > 0) {
              const isOpen = openGroups[item.id] ?? true;

              return (
                <div key={item.id} className="space-y-1">
                  {/* 대메뉴 헤더 (클릭 시 접기/펼치기) */}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors select-none"
                    onClick={() => toggleGroup(item.id)}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{item.label}</span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  {/* 하위 메뉴 리스트 */}
                  {isOpen && (
                    <div className="pl-4 space-y-0.5">
                      {item.children.map((sub) => {
                        const isSearched = isMatchSearch(sub.label);
                        const isActive = pathname === sub.href;

                        return (
                          <Link
                            key={sub.id}
                            href={sub.href || "/admin"}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border transition-colors ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border-blue-200/50 dark:border-blue-900/50 shadow-xs"
                                : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                            } ${!isSearched ? "opacity-30" : ""}`}
                            title={sub.description || sub.label}
                          >
                            <span
                              className={`text-[8px] ${
                                isActive
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-slate-300 dark:text-slate-600"
                              }`}
                            >
                              ●
                            </span>
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // 단일 메뉴인 경우 (대시보드 등)
            const isSearched = isMatchSearch(item.label);
            const isActive =
              pathname === item.href ||
              (item.href === "/admin" && pathname === "/admin");

            return (
              <Link
                key={item.id}
                href={item.href || "/admin"}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                } ${!isSearched ? "opacity-30" : ""}`}
                title={item.description || item.label}
              >
                {item.id === "dashboard" ? (
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                ) : (
                  <span className="text-[10px]">•</span>
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3) 푸터 영역 (다크모드 토글 & 사용자 대시보드 바로가기) */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5 shrink-0">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer"
          onClick={toggleDarkMode}
          title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          <div className="flex items-center gap-2">
            <span>{isDarkMode ? "🌙" : "☀️"}</span>
            <span className="text-xs font-semibold">
              {isDarkMode ? "다크 모드" : "라이트 모드"}
            </span>
          </div>
          <div
            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
              isDarkMode ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                isDarkMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </button>

        <Link
          href="/"
          className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          ← 사용자 대시보드
        </Link>
      </div>
    </aside>
  );
}
