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
  return (
    <div className="topbar">
      <Link
        href="/"
        className="brand"
        style={{ color: "inherit", textDecoration: "none" }}
      >
        RO<span>MS</span>
      </Link>

      <div className="nav-tabs">
        {USER_NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-tab ${activeTab === item.label ? "active" : ""}`}
            onClick={() => {
              setActiveTab(item.label);
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      <Link href="/admin" className="admin-switch-btn ml-4">
        ⚙️ 관리자 대시보드
      </Link>

      <div className="search-wrap">
        <input
          id="searchInput"
          type="text"
          placeholder="선수 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={onSearchSubmit}
        />
        <svg viewBox="0 0 24 24" fill="none" stroke="#14141A" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>
  );
}
