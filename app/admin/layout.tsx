// app/admin/layout.tsx
import React from "react";

export const metadata = {
  title: "ROMS Admin Dashboard",
  description: "ROMS 시스템 관리자 페이지",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-wrapper">{children}</div>;
}
