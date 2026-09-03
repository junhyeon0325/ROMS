// components/layout/AdminSidebar.tsx
// 관리자 사이드바
"use client";

import React from "react";
import Link from "next/link";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tabLabel: string) => void;
  filteredMenuList: string[];
  onToast: (msg: string) => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  filteredMenuList,
  onToast,
}: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar">
      <div
        className="sidebar-brand"
        onClick={() => onToast("관리자 홈으로 이동합니다")}
      >
        RO<span>MS</span> <span className="admin-tag">[ADMIN]</span>
      </div>

      <div className="sidebar-menu">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isSearched = filteredMenuList.includes(item.label);
          const isActive = activeTab === item.label;

          return (
            <div
              key={item.id}
              className={`sidebar-item ${isActive ? "active" : ""} ${!isSearched ? "dimmed" : ""}`}
              onClick={() => {
                setActiveTab(item.label);
                onToast(`${item.label} 화면으로 전환합니다`);
              }}
            >
              <span className="sidebar-item-bullet">•</span>
              <span className="sidebar-item-text">{item.label}</span>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <Link href="/" className="admin-switch-btn">
          ← 사용자 대시보드
        </Link>
      </div>
    </aside>
  );
}
