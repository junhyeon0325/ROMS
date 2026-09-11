// app/admin/layout.tsx
/**
 * [관리자 공통 레이아웃 컴포넌트]
 * - 모든 관리자 페이지(/admin/*)를 감싸는 프레임 레이아웃
 * - 관리자 상태(AdminContext), 좌측 사이드바, 상단 헤더, 하단 푸터를 일괄 적용
 */
import React from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminFooter from "@/components/layout/AdminFooter";
import { AdminProvider } from "@/lib/context/AdminContext";

export const metadata = {
  title: "ROMS Admin Dashboard",
  description: "ROMS 시스템 관리자 페이지",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAFAF7] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <AdminHeader />
          <main className="flex-1 min-h-0 p-4 md:p-6 w-full max-w-[1600px] mx-auto flex flex-col overflow-y-auto xl:overflow-hidden">
            {children}
          </main>
          <AdminFooter />
        </div>
      </div>
    </AdminProvider>
  );
}
