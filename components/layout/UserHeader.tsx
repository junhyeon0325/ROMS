// components/layout/UserHeader.tsx
"use client";

import React from "react";
import Link from "next/link";
import { USER_NAV_ITEMS } from "@/lib/constants/navigation";

interface UserHeaderProps {
  activeTab: string;
  setActiveTab: (tabLabel: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function UserHeader({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
}: UserHeaderProps) {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("roms_theme", "dark");
      } catch (e) {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("roms_theme", "light");
      } catch (e) {}
    }
  };

  return (
    <div className="flex items-center gap-6 px-6 md:px-12 py-5 border-b border-slate-200/80 dark:border-slate-800 bg-[#FAFAF7] dark:bg-[#0B0E14] sticky top-0 z-30 backdrop-blur-md">
      {/* 브랜드 로고 */}
      <Link
        href="/"
        className="font-black text-lg tracking-tight text-slate-900 dark:text-white shrink-0 cursor-pointer"
      >
        RO<span className="text-blue-600">MS</span>
      </Link>

      {/* 네비게이션 탭 */}
      <div className="hidden md:flex items-center gap-6 ml-3">
        {USER_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`text-xs font-bold pb-1 cursor-pointer transition-all border-b-2 ${
              activeTab === item.label
                ? "text-slate-900 dark:text-white border-blue-600"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border-transparent"
            }`}
            onClick={() => {
              setActiveTab(item.label);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 관리자 대시보드 바로가기 */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors ml-auto md:ml-4 shrink-0"
      >
        <span>⚙️</span>
        <span>관리자 대시보드</span>
      </Link>

      {/* 테마 토글 버튼 */}
      <button
        type="button"
        onClick={toggleTheme}
        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors shrink-0"
        title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      >
        <span>{isDark ? "☀️" : "🌙"}</span>
      </button>

      {/* 검색창 */}
      <div className="relative w-36 sm:w-48 md:w-56 shrink-0">
        <input
          id="searchInput"
          type="text"
          placeholder="선수 검색"
          className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 py-1 pl-1 pr-6 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-slate-900 dark:focus:border-slate-300 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={onSearchSubmit}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>
  );
}
