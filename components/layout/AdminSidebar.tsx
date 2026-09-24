// components/layout/AdminSidebar.tsx
/**
 * [관리자 좌측 사이드바 컴포넌트]
 * - 관리자 전체 메뉴를 탐색하는 내비게이션 패널
 * - 메뉴 실시간 검색, 대메뉴 접기/펼치기(아코디언), 다크모드 전환 스위치 제공
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { useAdminUi } from "@/lib/context/AdminFeatureContexts";

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { menuSearchQuery, setMenuSearchQuery, isDarkMode, toggleDarkMode } = useAdminUi();

  // 메뉴 활성화(선택) 여부 판정
  const isItemActive = (href?: string) => {
    if (!href) return false;
    if (pathname === href) return true;
    const hasExactMatchOther = ADMIN_NAV_ITEMS.some((g) =>
      g.children?.some((c) => c.href === pathname)
    );
    if (hasExactMatchOther) return false;
    return href !== "/admin" && pathname.startsWith(href + "/");
  };

  // 현재 pathname이 속한 상위 그룹 ID 찾기
  const getParentGroupId = (path: string) => {
    for (const item of ADMIN_NAV_ITEMS) {
      if (item.children) {
        const hasActiveChild = item.children.some((sub) => {
          if (!sub.href) return false;
          if (path === sub.href) return true;
          const hasExactMatchOther = ADMIN_NAV_ITEMS.some((g) =>
            g.children?.some((c) => c.href === path)
          );
          if (hasExactMatchOther) return false;
          return sub.href !== "/admin" && path.startsWith(sub.href + "/");
        });
        if (hasActiveChild) return item.id;
      }
    }
    return null;
  };

  // 대메뉴 접기/펼치기 상태 관리 (현재 접속 중인 메뉴의 상위 그룹은 기본적으로 열림)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const activeGroup = getParentGroupId(pathname);
    ADMIN_NAV_ITEMS.forEach((item) => {
      if (item.children) {
        initial[item.id] = item.id === activeGroup;
      }
    });
    return initial;
  });

  // URL(pathname) 변경 시 현재 메뉴의 상위 그룹 자동 펼침
  useEffect(() => {
    const activeGroup = getParentGroupId(pathname);
    if (activeGroup) {
      setOpenGroups((prev) => {
        if (prev[activeGroup]) return prev;
        return {
          ...prev,
          [activeGroup]: true,
        };
      });
    }
  }, [pathname]);

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

  // 검색 가능한 전체 메뉴 평탄화 (Enter 네비게이션용)
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
    <aside className="w-64 bg-white dark:bg-[#111726] border-r border-slate-200 dark:border-slate-800 flex flex-col p-5 md:p-6 sticky top-0 h-screen shrink-0 z-30 justify-between">
      {/* 1) 브랜드 로고 & 메뉴 검색 & 네비게이션 메뉴 */}
      <div className="flex flex-col flex-1 min-h-0 mb-3">
        {/* 로고 */}
        <Link
          href="/admin"
          className="font-black text-xl tracking-tight mb-4 pb-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1 text-slate-900 dark:text-white shrink-0"
          title="관리자 대시보드로 이동"
        >
          RO<span className="text-[#f99e1a]">MS</span>{" "}
          <span className="text-[10px] font-mono font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 ml-1.5">
            ADMIN
          </span>
        </Link>

        {/* 좌측 메뉴 검색 입력창 */}
        <div className="relative mb-3 shrink-0">
          <div className="relative">
            <input
              type="text"
              className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 focus:border-[#f99e1a] dark:focus:border-[#f99e1a] focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-2xs"
              placeholder="메뉴 검색..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {menuSearchQuery && (
              <button
                type="button"
                onClick={() => setMenuSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] transition-colors"
                title="검색어 초기화"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 2) 네비게이션 메뉴 */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 py-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            // 하위 메뉴가 있는 대메뉴 그룹인 경우
            if (item.children && item.children.length > 0) {
              const hasMatchingChild = item.children.some((sub) => isMatchSearch(sub.label));
              const isOpen = (menuSearchQuery.trim() && hasMatchingChild) ? true : (openGroups[item.id] ?? false);

              return (
                <div key={item.id} className="space-y-1">
                  {/* 대메뉴 헤더 (클릭 시 접기/펼치기) */}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors select-none"
                    onClick={() => toggleGroup(item.id)}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2">
                      {item.id === "seasons" ? (
                        <svg
                          className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                          <path d="M4 22h16" />
                          <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
                          <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                        </svg>
                      ) : item.id === "developer" ? (
                        <svg
                          className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-slate-400 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
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
                        const isActive = isItemActive(sub.href);

                        return (
                          <Link
                            key={sub.id}
                            href={sub.href || "/admin"}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border transition-colors ${
                              isActive
                                ? "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border-amber-500/30 shadow-xs"
                                : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                            } ${!isSearched ? "opacity-30" : ""}`}
                            title={sub.description || sub.label}
                          >
                            <span
                              className={`text-[8px] ${
                                isActive
                                  ? "text-amber-500 dark:text-amber-400"
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
                    ? "bg-[#f99e1a] text-slate-950 font-bold shadow-sm"
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
              isDarkMode ? "bg-[#f99e1a]" : "bg-slate-300"
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
