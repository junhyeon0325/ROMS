// app/admin/layout.tsx
/**
 * [관리자 공통 레이아웃 컴포넌트]
 * - 모든 관리자 페이지(/admin/*)를 감싸는 프레임 레이아웃
 * - 관리자 상태(AdminContext), 좌측 사이드바, 상단 헤더, 하단 푸터를 일괄 적용
 */
import React from "react";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminFooter from "@/components/layout/AdminFooter";
import { AdminProvider } from "@/lib/context/AdminContext";
import { AuthorizationError, requireAdmin } from "@/lib/auth-guards";

export const metadata = {
  title: "ROMS Admin Dashboard",
  description: "ROMS 시스템 관리자 페이지",
};

// 미들웨어에 더해 서버 세션의 ADMIN·DEV 역할을 재검증하고 관리자 UI를 렌더링한다.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) {
      redirect("/login?callbackUrl=/admin");
    }
    redirect("/");
  }

  return (
    <AdminProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAFAF7] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <AdminHeader user={user} />
          <main className="flex-1 min-h-0 p-4 md:p-6 w-full max-w-[1600px] mx-auto flex flex-col overflow-y-auto xl:overflow-hidden">
            {children}
          </main>
          <AdminFooter />
        </div>
      </div>
    </AdminProvider>
  );
}
