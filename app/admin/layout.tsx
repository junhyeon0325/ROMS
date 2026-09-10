// app/admin/layout.tsx
import React from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
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
      <div className="flex min-h-screen bg-[#FAFAF7] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}
