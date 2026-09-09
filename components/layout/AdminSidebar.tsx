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
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  filteredMenuList,
}: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar">
      <Link
        href="/admin"
        className="sidebar-brand"
        style={{ display: "block", color: "inherit", textDecoration: "none" }}
      >
        RO<span>MS</span> <span className="admin-tag">[ADMIN]</span>
      </Link>

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
